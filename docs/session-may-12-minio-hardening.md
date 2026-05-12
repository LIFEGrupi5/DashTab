# Session — May 12, 2026: MinIO Hardening + Backend Hygiene

Follow-up to [`session-may-11-minio-storage.md`](./session-may-11-minio-storage.md). The May 11 session landed a working presigned-upload flow for menu-item images but left several real security and hygiene gaps. This session reviewed the as-built code, fixed the gaps, and tidied a handful of related backend issues that showed up along the way.

## Review pass — what was wrong

Three real issues with the image-upload flow:

1. **`contentType` parameter was dead code.** `IStorageService.CreatePresignedUploadAsync` accepted a `contentType` argument but `MinioStorageService` never bound it to the presigned URL. A client could request a URL for `image/png` and upload `image/svg` (or arbitrary bytes) instead — the URL wasn't tied to a content type.
2. **No file-extension validation.** `RequestImageUploadAsync` accepted any string for `fileExtension` and concatenated it into the object key (`menu-items/{id}/{guid}.{ext}`) and Content-Type (`image/{ext}`). `"exe"`, `"svg"`, `""` — all accepted.
3. **No file-size cap.** Presigned PUT URLs had no upper bound on payload size. Any authenticated Owner/Manager could upload a multi-GB blob.

Plus three defense-in-depth and hygiene gaps:

4. **Cross-item key reuse.** `ConfirmImageAsync` verified the object existed in MinIO but never checked the key path matched the menu item being confirmed against. An Owner could request a URL for item A and confirm it against item B.
5. **Bucket name duplicated** between `MenuItemService.ImageBucket = "menu-images"` and `StorageBucketBootstrapper.Buckets`.
6. **No tests for the image flow.** Only the four pre-existing mapper test files existed; nothing covered `MenuItemService` or the storage abstraction.

And one structural CI bug discovered while looking at the test layout:

7. **Backend test directory was outside `src/backend/`.** Backend CI's path filter is `src/backend/**` — but tests lived at `tests/backend/`, so a PR that only touched tests didn't trigger backend CI.

Five further items uncovered during the work:

8. **Soft-delete leaked storage.** `MenuItemService.DeleteAsync` flipped `IsDeleted = true` but left the object in MinIO. Because the bucket is public-read, the image stayed reachable by direct URL after the menu item was "deleted."
9. **All buckets got public-read.** `StorageBucketBootstrapper` looped over `Buckets` and applied a public-read policy unconditionally. Fine for `menu-images`, but a future private bucket would silently inherit the same policy.
10. **`EFCore.Relational` version conflict.** `Hangfire.PostgreSql 1.21.1` transitively pulled `EntityFrameworkCore.Relational 9.0.1`; everything else used `9.0.4`. MSB3277 conflict warning, harmless at runtime but noise on every build.
11. **MailKit / MimeKit 4.8.0 vulnerabilities.** Two moderate-severity advisories (GHSA-9j88-vvj5-vhgr, GHSA-g7hc-96xr-gvvx) showed up on every restore.
12. **Migration drift.** `20260511155639_AddMenuItemImage` bundled the `image_object_key` add with 5 unrelated `AlterColumn` calls on `is_deleted` defaults — actually real schema drift (the model declared `HasDefaultValue(false)` but `InitialCreate` never persisted it), but bundled under a misleading migration name.

## Fixes — security pass

### 1. Content-Type bound to presigned URL

`MinioStorageService.CreatePresignedUploadAsync` now calls `.WithHeaders(["Content-Type"] = contentType)`. The signature is computed over the headers, so the client MUST send the exact same Content-Type when uploading or MinIO rejects the PUT.

`PresignedUploadUrl` gained a `ContentType` field so the client knows what header to send.

### 2. Extension whitelist via FluentValidation

New `Application/Storage/ImagePolicy.cs` is the single source of truth:

```csharp
public static class ImagePolicy
{
    public const long MaxBytes = 5 * 1024 * 1024;

    public static readonly IReadOnlyDictionary<string, string> AllowedExtensions =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["png"] = "image/png",
            ["jpg"] = "image/jpeg",
            ["jpeg"] = "image/jpeg",
            ["webp"] = "image/webp",
        };

    public static string? ResolveContentType(string? fileExtension) { ... }
}
```

New `ImageUploadRequestValidator` rejects anything outside the whitelist. Picked up by the existing `AddValidatorsFromAssemblyContaining` + `AddFluentValidationAutoValidation` chain — invalid extensions return a structured 422 before reaching the service. `RequestImageUploadAsync` also calls `ResolveContentType` defensively and throws `InvalidOperationException` (→ 400) if it ever gets through.

### 3. Size + content-type enforcement at confirm

`IStorageService.ExistsAsync` (returning `bool`) is gone, replaced with `StatAsync` returning `StoredObjectInfo?` (`Size`, `ContentType`). One round-trip now returns existence + the metadata needed to validate.

`ConfirmImageAsync` enforces:

- `stat.Size > ImagePolicy.MaxBytes` → delete the object, throw `InvalidOperationException` (→ 400)
- `stat.ContentType` doesn't start with `image/` → same

Both paths delete the offending object before throwing so it doesn't sit orphaned in the bucket.

### 4. Object key prefix check

`ConfirmImageAsync` first thing now:

```csharp
if (!objectKey.StartsWith($"menu-items/{id}/", StringComparison.Ordinal))
    return null;
```

Returns null (→ 404) rather than 400 to avoid leaking whether a foreign key happens to exist in storage. Prevents an authenticated Owner from requesting a URL for item A and committing it to item B.

### 5. Soft-delete cleans MinIO

`MenuItemService.DeleteAsync` now deletes the object and clears `ImageObjectKey` before flipping `IsDeleted = true`. Two tests cover the with-image and without-image branches.

## Fixes — hygiene pass

### Centralized bucket name

New `Application/Storage/StorageBuckets.cs`:

```csharp
public static class StorageBuckets
{
    public const string MenuImages = "menu-images";
}
```

Referenced by `MenuItemService` and `StorageBucketBootstrapper`. The local `ImageBucket` constant is gone.

### Per-bucket public-read policy

`StorageBucketBootstrapper` replaced its `string[] Buckets` with a `BucketSpec(string Name, bool PublicRead)` record array. The public-read policy is applied only when `PublicRead: true`. Future private buckets are a one-tuple addition without inheriting the public default.

### EF Core Relational pinned in Infrastructure

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Relational" Version="9.0.4" />
```

Cleared MSB3277 in all downstream consumers (the test project specifically).

### MailKit / MimeKit → 4.16.0

`dotnet add package MailKit` pulled `4.16.0`, which transitively bumped MimeKit to `4.16.0`. Both NU1902 advisories cleared. Side effect: tighter NRT annotations in MailKit 4.16 surfaced two pre-existing CS8604 warnings in `EmailService.cs` where `config["Smtp:From"]` and `config["Smtp:Host"]` could be null — flagged for follow-up, not in scope of this session.

### Migration split

`20260511155639_AddMenuItemImage` deleted. Replaced with two migrations:

- `20260512175529_AlignIsDeletedDefaults.cs` — only the 5 `AlterColumn` calls that add `DEFAULT false` to `is_deleted` on every table. This is real schema drift, not cosmetic — the model declared `.HasDefaultValue(false)` but `InitialCreate` never persisted it.
- `20260512175625_AddMenuItemImage.cs` — only the `AddColumn<string>("image_object_key")` on `menu_items`.

Performed via `dotnet ef migrations remove --force`, temporarily marking `MenuItem.ImageObjectKey` `[NotMapped]`, generating `AlignIsDeletedDefaults`, removing `[NotMapped]`, then generating `AddMenuItemImage`. Snapshot is consistent with both.

### Test project restructure

`tests/backend/DashTab.UnitTests/` → `src/backend/tests/DashTab.UnitTests/`. The frontend already uses `src/frontend/tests/` so this matches.

The reason: backend CI's path filter is `paths: 'src/backend/**'`. With tests outside that prefix, a PR that only changed tests didn't trigger CI. Moving them under `src/backend/` made the filter cover them naturally — no workflow edit needed.

Path adjustments:

- `DashTab.UnitTests.csproj` `ProjectReference` paths: `..\..\..\src\backend\X` → `..\..\X`
- `DashTab.sln` test path: `..\..\tests\backend\DashTab.UnitTests\…` → `tests\DashTab.UnitTests\…`

`git mv` of the tracked files preserved history. Build outputs (`bin/`/`obj/`) were deleted first to avoid file locks.

## Tests added

`tests/DashTab.UnitTests/Services/MenuItemServiceImageTests.cs` (19 new test cases — 17 from the security pass + 2 from soft-delete cleanup):

| Method | Cases |
|---|---|
| `RequestImageUploadAsync` | item not found; unsupported extension (`exe`/`svg`/empty); valid extension binds correct content type (`png`/`jpg`/`jpeg`/`webp`) |
| `ConfirmImageAsync` | cross-item key rejected (storage untouched); item not found; object missing; oversized → delete + throw + not persisted; non-image content-type → delete + throw; happy path → key persisted + old image deleted |
| `RemoveImageAsync` | item not found; no image set; happy path |
| `DeleteAsync` (new) | with image → object deleted; without image → storage untouched |

Test infrastructure stayed lightweight — hand-rolled fakes (`FakeStorageService`, `NoopCacheService`), EF Core InMemory provider, no Moq/NSubstitute. Added `Microsoft.EntityFrameworkCore.InMemory` and a `ProjectReference` to `DashTab.Infrastructure` (previously only Domain + Application were referenced).

## End state

- Backend build: 0 errors, 4 warnings (down from 15 — MailKit/MimeKit advisories gone, EF Relational conflict gone, 2 latent CS8604 in EmailService surfaced by tighter MailKit annotations)
- Tests: 46/46 pass (up from 27)
- Backend CI now triggers on test-only changes
- Two clean migrations replace the bundled one; users need to run `dotnet ef database update` to apply both

## Lessons learned

1. **A signed presigned URL only enforces what you sign into it.** The MinIO SDK accepted a `contentType` parameter that did nothing unless wired through `WithHeaders`. The fix was a 3-line addition; the bug was a 1-line silent omission. Always trace a parameter from the public API to where it actually shapes behavior — if it doesn't, either remove it or wire it.

2. **Defensive validation at multiple layers is cheap.** The extension whitelist runs in FluentValidation at the API boundary (422), but `ImagePolicy.ResolveContentType` is also called inside the service as a guard (throws `InvalidOperationException` → 400). The same constant powers both. Belt-and-suspenders cost is a few lines; the alternative is trusting that every future caller goes through the validator.

3. **Path filters on CI workflows lie if you don't keep the layout aligned.** `paths: 'src/backend/**'` looked correct but didn't match `tests/backend/**`. Test-only PRs silently merged without CI. The cheap fix was the right one (move tests under the filter) rather than expanding the filter.

4. **Migration drift can be real schema drift, not just snapshot drift.** The bundled `AlterColumn` calls on `is_deleted` weren't no-ops — `InitialCreate` never put `DEFAULT false` on those columns even though `OnModelCreating` declared `.HasDefaultValue(false)`. Splitting the migration made the history honest and gave the schema-drift fix its own dedicated migration so future readers know it's not part of the image feature.

5. **`[NotMapped]` is the right tool for surgically splitting a migration.** Mark the new property `[NotMapped]`, generate the "everything else" migration, remove `[NotMapped]`, generate the property's migration. Cleaner than manually editing migration files and updating Designer snapshots by hand.

6. **Hand-rolled fakes are fine for service tests.** No need to add Moq or NSubstitute when the surface area is small. `FakeStorageService` is 30 lines, records calls, and supports per-test scripting via a `Func<,,>` delegate. Adds zero package dependencies and the test code reads as plainly as English.
