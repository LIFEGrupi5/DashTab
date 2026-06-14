# Session — May 11, 2026: MinIO Object Storage Integration

> **Follow-up:** see [`session-may-12-minio-hardening.md`](./session-may-12-minio-hardening.md) for the security/hygiene pass that landed the next day — content-type binding, extension whitelist, size cap, soft-delete cleanup, migration split, test layout restructure, and the per-bucket policy refactor. The architecture below is the as-built May 11 record; some file paths and `IStorageService` method names changed in the follow-up.

## What MinIO Is (in this project)

MinIO is a self-hosted, S3-compatible object storage server. In DashTab it holds binary files — currently menu-item photos. Everything else (Postgres, Redis, RabbitMQ) is structured data; MinIO is the place for files.

The MinIO container has been provisioned in `devops/docker/docker-compose.yml` since early in the project (ports `9000` for the S3 API, `9001` for the web console at `http://localhost:9001`), but nothing was wired to it from the backend until this session. This session adds the full integration: storage abstraction, presigned upload URLs, automatic bucket bootstrap, and the first consumer (menu-item images).

---

## Architecture — Where Each Piece Lives

```
src/backend/
  DashTab.Application/
    Interfaces/IStorageService.cs              ← abstraction (no MinIO type leaks here)
    Dtos/PresignedUploadUrl.cs                 ← { Url, ObjectKey, ExpiresAt }
    Dtos/MenuDtos.cs                           ← ImageUploadRequest, CommitImageRequest, MenuItemDto.ImageUrl
    Interfaces/IMenuItemService.cs             ← +3 image methods
    Mappings/MenuItemMapper.cs                 ← ignores ImageObjectKey / ImageUrl (handled by service)

  DashTab.Domain/
    Entities/MenuItem.cs                       ← +ImageObjectKey (string?)

  DashTab.Infrastructure/
    Services/Storage/
      StorageOptions.cs                        ← config binding (Endpoint, PublicBaseUrl, AccessKey, SecretKey, UseSsl)
      MinioStorageService.cs                   ← IStorageService implementation
      StorageBucketBootstrapper.cs             ← IHostedService — auto-creates buckets on startup
    Services/MenuItemService.cs                ← +RequestImageUploadAsync / ConfirmImageAsync / RemoveImageAsync
    Migrations/20260511155639_AddMenuItemImage.cs

  DashTab.API/
    Controllers/MenuItemsController.cs         ← 3 image endpoints
    Program.cs                                 ← MinioClient registration, IStorageService + bootstrapper
    appsettings.Development.json               ← Storage section
    DashTab.Infrastructure.csproj              ← Minio 6.0.4

devops/docker/
  docker-compose.yml                           ← Storage__PublicBaseUrl env + minio healthcheck dependency
```

Layer purity: `IStorageService` is in `Application` and has no MinIO types in its signature. Only `MinioStorageService` and `StorageBucketBootstrapper` touch `Minio.*` types — they live in `Infrastructure`. The API project has one transitive reference to `IMinioClient` for the DI factory wiring, which is acceptable since `Program.cs` is allowed to know concrete infrastructure.

---

## Step-by-Step: Upload Flow

The pattern is **presigned URLs** — the browser uploads bytes directly to MinIO, not through the API. The API only signs the URL and confirms the upload afterward.

### Step 1 — Browser asks API for an upload URL

```
POST /api/v1/menu-items/{id}/image/upload-url
Authorization: Bearer <jwt>
Content-Type: application/json

{ "fileExtension": "jpg" }
```

`MenuItemsController.RequestImageUpload` (controller):
- Requires `Owner` or `Manager` role (`[Authorize(Roles = "Owner,Manager")]`)
- Calls `IMenuItemService.RequestImageUploadAsync(id, "jpg", ct)`

`MenuItemService.RequestImageUploadAsync`:
1. Verifies the menu item exists (`db.MenuItems.AnyAsync`)
2. Generates an object key: `menu-items/{itemId}/{guid}.jpg`
3. Calls `IStorageService.CreatePresignedUploadAsync("menu-images", key, 15min, "image/jpg", ct)`

`MinioStorageService.CreatePresignedUploadAsync`:
1. Asks the MinIO SDK to sign a PUT URL valid for 15 minutes
2. The returned URL embeds the internal endpoint (e.g. `http://minio:9000/...?X-Amz-Signature=...`)
3. **Rewrites the host portion** of the URL: replaces the internal base (`http://minio:9000`) with `Storage:PublicBaseUrl` (`http://localhost:9000`) — so the browser can actually reach it
4. Returns `{ Url, ObjectKey, ExpiresAt }`

Response to browser:
```json
{
  "url": "http://localhost:9000/menu-images/menu-items/abc.../def....jpg?X-Amz-Algorithm=...&X-Amz-Signature=...",
  "objectKey": "menu-items/abc.../def....jpg",
  "expiresAt": "2026-05-11T16:11:23Z"
}
```

### Step 2 — Browser uploads bytes directly to MinIO

```
PUT http://localhost:9000/menu-images/menu-items/abc.../def....jpg?X-Amz-Signature=...
Content-Type: image/jpeg

<binary file bytes>
```

The API server is not involved in this step. The browser streams the file straight to MinIO. The signature in the URL is what authorizes the write — MinIO validates it without needing any other auth header. The signature is bucket+object+expiry-specific, so the URL cannot be reused for a different file.

### Step 3 — Browser tells API the upload is done

```
PUT /api/v1/menu-items/{id}/image
Authorization: Bearer <jwt>
Content-Type: application/json

{ "objectKey": "menu-items/abc.../def....jpg" }
```

`MenuItemsController.ConfirmImage` → `MenuItemService.ConfirmImageAsync`:
1. Loads the menu item from Postgres (with category, for the response DTO)
2. Calls `IStorageService.ExistsAsync("menu-images", objectKey, ct)` — does a HEAD against MinIO to verify the object actually got uploaded. Returns `404` if not.
3. If the item already had an image, **deletes the old object** from MinIO so we don't leak storage
4. Sets `item.ImageObjectKey = objectKey`, `item.UpdatedAt = UtcNow`, saves to Postgres
5. Invalidates Redis caches: `menu:items:all`, `menu:item:{id}`, `menu:items:cat:{categoryId}`
6. Returns the updated `MenuItemDto` — with `ImageUrl` populated

The `ImageUrl` on the DTO is computed in `MenuItemService.ToDto`:
```csharp
private MenuItemDto ToDto(MenuItem item) =>
    mapper.ToDto(item) with
    {
        ImageUrl = item.ImageObjectKey is null
            ? null
            : storage.GetPublicUrl(ImageBucket, item.ImageObjectKey)
    };
```

The Mapperly mapper handles every other field; the service wraps it to add the computed URL. This keeps the mapper stateless (no storage service injected into it).

---

## Step-by-Step: Display Flow

When the menu page loads:

1. Browser calls `GET /api/v1/menu-items` → API returns DTOs with `imageUrl: "http://localhost:9000/menu-images/menu-items/abc.../def....jpg"`
2. React renders `<img src={item.imageUrl} />`
3. Browser fetches the URL directly from MinIO — no presigning, no expiry. MinIO serves the bytes because the `menu-images` bucket has a public-read policy applied at bootstrap time.

No API involvement, no Authorization header, no signature. Images cache like any static asset; the URL is stable for as long as the object key doesn't change.

---

## Step-by-Step: Delete Flow

```
DELETE /api/v1/menu-items/{id}/image
Authorization: Bearer <jwt>
```

`MenuItemService.RemoveImageAsync`:
1. Loads the item. If no `ImageObjectKey`, returns `false` → 404.
2. Calls `IStorageService.DeleteAsync("menu-images", item.ImageObjectKey, ct)` — MinIO removes the object.
3. Clears `ImageObjectKey` to null on the entity, saves to Postgres.
4. Invalidates the same three cache keys as the confirm flow.

---

## Step-by-Step: Bucket Bootstrapping (Startup)

The API doesn't assume the `menu-images` bucket exists. `StorageBucketBootstrapper` is registered as an `IHostedService` in `Program.cs`:

```csharp
builder.Services.AddHostedService<StorageBucketBootstrapper>();
```

ASP.NET Core's hosting model calls `StartAsync` on every registered `IHostedService` after the DI container is built but before the API begins accepting requests. The bootstrapper:

1. For each known bucket (`["menu-images"]`):
   - Calls `BucketExistsAsync` → if false, calls `MakeBucketAsync`
   - Applies a public-read policy via `SetPolicyAsync`. The policy is:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Principal": { "AWS": ["*"] },
         "Action": ["s3:GetObject"],
         "Resource": ["arn:aws:s3:::menu-images/*"]
       }]
     }
     ```
   - This makes every `GET` against `/menu-images/<anything>` succeed without auth — necessary for `<img src>` to work.
2. If anything fails (e.g. MinIO not ready), retries up to 5 times with exponential backoff (`Task.Delay(attempt * 2s)`).

The docker-compose `backend` service has `depends_on: minio: condition: service_healthy`, so in practice MinIO is already healthy by the time the API starts and the first attempt succeeds.

---

## Config — Why There Are Two URLs

The trickiest part of S3-style integrations in Docker is that **the API and the browser don't agree on what "MinIO" is reachable at**:

| Caller | Reachable as | Reason |
|---|---|---|
| API container (server-side ops, bucket bootstrap, presigning, exists/delete) | `http://minio:9000` | Docker bridge network DNS resolves `minio` to the container |
| Browser (presigned upload URL, public image read) | `http://localhost:9000` | The MinIO container publishes port 9000 to the host |

So `StorageOptions` has **two** URL fields:

- `Storage:Endpoint` = `http://minio:9000` (server-side; what the .NET MinIO client connects to)
- `Storage:PublicBaseUrl` = `http://localhost:9000` (used in two places: as the prefix when generating public image URLs in `GetPublicUrl`, and as the replacement target when rewriting presigned URL hostnames)

`MinioStorageService` stores both. When MinIO signs a presigned PUT URL, it stamps it with whatever endpoint the client was configured with (`http://minio:9000`). We string-replace that prefix with `PublicBaseUrl` before returning the URL to the browser. The signature itself is computed over the object key and headers — **not the hostname** — so rewriting the host doesn't invalidate the signature.

In local-dev without Docker (running the API directly via `dotnet run`), both URLs point to `http://localhost:9000` and the rewrite is a no-op. `appsettings.Development.json`:

```json
"Storage": {
  "Endpoint": "http://localhost:9000",
  "PublicBaseUrl": "http://localhost:9000",
  "UseSsl": false
}
```

`AccessKey` and `SecretKey` are not in the JSON — they're in `dotnet user-secrets` (matching the pattern already used for `ConnectionStrings:Default`):

```bash
cd src/backend/DashTab.API
dotnet user-secrets set "Storage:AccessKey" "dashtab"
dotnet user-secrets set "Storage:SecretKey" "minio_dev_password"
```

(Values come from `devops/docker/.env`.)

---

## The Mapper Wrapper Pattern

`MenuItemMapper` is generated by Mapperly and registered as a singleton — it has no dependencies and is stateless. But `MenuItemDto.ImageUrl` is a computed value that needs `IStorageService` to build the URL.

Rather than inject `IStorageService` into the mapper (which would defeat the point of a stateless code-generated mapper), `MenuItemService` defines a private `ToDto` helper that wraps `mapper.ToDto(item)` with a `with { ImageUrl = ... }` expression. Every call site in the service was updated to use `ToDto(item)` instead of `mapper.ToDto(item)`.

The mapper's `[MapperIgnoreSource(nameof(MenuItem.ImageObjectKey))]` + `[MapperIgnoreTarget(nameof(MenuItemDto.ImageUrl))]` attributes tell Mapperly not to try to map between these — they're owned by the service layer.

---

## End State

- `POST /api/v1/menu-items/{id}/image/upload-url` → returns presigned PUT URL valid for 15 min
- `PUT /api/v1/menu-items/{id}/image` → confirms upload, persists `ImageObjectKey`, returns DTO with `imageUrl`
- `DELETE /api/v1/menu-items/{id}/image` → deletes object, clears column
- `GET /api/v1/menu-items` → DTOs include `imageUrl` for items that have one (null for items that don't)
- `menu-images` bucket auto-created on API startup with public-read policy
- Old image is deleted when a new one is committed (no leaked objects)
- All three write endpoints invalidate the menu Redis caches
- Frontend integration is pending (separate PR)

## Lessons Learned

1. **The internal/public endpoint split is the central design decision in any Dockerized S3 integration.** Without it, presigned URLs work in `curl` from the API container and silently fail in the browser. The string-replacement rewrite in `MinioStorageService` is a 3-line fix that papers over what would otherwise require Keycloak-style backchannel handlers or external MinIO config (`MINIO_PUBLIC_URL`-style env vars that don't actually affect SDK-generated presigned URLs).
2. **Bucket bootstrap belongs in the app, not in a separate provisioning script.** A `IHostedService` that idempotently ensures buckets exist + applies policies means a fresh `docker compose up` always converges to a working state. No "did you remember to run the setup script" tribal knowledge.
3. **Don't inject infrastructure services into Mapperly mappers.** The stateless code-generated mapper is the right model for pure field-to-field mapping. Computed fields that need services (like `ImageUrl` from a storage service) go in a thin service wrapper. The two `[MapperIgnore*]` attributes are the contract.
4. **Presigned PUT is the simplest browser-direct upload, but it doesn't enforce size or content-type at MinIO.** We rely on the `ExistsAsync` HEAD in `ConfirmImageAsync` to verify the upload happened, but not to validate it. If we later need a hard 5 MB cap or strict MIME enforcement, that's a switch to presigned POST policies — a bigger refactor on the client side. For menu photos this trade-off is fine.
5. **EF migrations pick up unrelated model snapshot drift.** When `dotnet ef migrations add AddMenuItemImage` ran, it also emitted `AlterColumn` calls for `is_deleted` on every table — because an earlier change to `HasDefaultValue(false)` had landed in the model without a corresponding migration. Those `AlterColumn` calls are harmless (no-op on existing tables) but worth noting: if a migration touches more than you expect, check the model snapshot for unrelated drift before regenerating.
