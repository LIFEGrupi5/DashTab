# AI PR Review — Phase 1B: Customer-Facing AI Menu Recommendation

**Rubric:** FS-9  
**PR:** [#155 — Feat/ai/customer recommendation](https://github.com/LIFEGrupi5/DashTab/pull/155)  
**Branch:** `feat/ai/customer-recommendation` → `development`  
**Reviewed at commit:** `7256870` (squash-merged 2026-06-13)  
**Review date:** 2026-06-14  
**Model used:** Claude Sonnet 4.6 (Claude Code agent, code-review pass)  
**Files reviewed:**
- `src/backend/DashTab.Application/Interfaces/IRecommendationService.cs`
- `src/backend/DashTab.Infrastructure/Services/RecommendationService.cs`
- `src/backend/DashTab.API/Controllers/PublicController.cs`
- `src/frontend/app/r/[restaurantId]/_components/RecommendClient.tsx`
- `src/frontend/lib/api/public.ts`

---

## Verdict: REQUEST CHANGES

3 high-severity bugs (one security, one correctness/UX, one data-integrity), plus 2 medium and 5 low/cleanup findings. The tenant isolation on the anonymous `Recommend` endpoint is correct; the IDOR is on the admin-only `Backfill` endpoint.

---

## Security

### HIGH — Backfill IDOR: any Owner/Manager can trigger embedding backfill on another restaurant

**File:** `PublicController.cs` line 43  
**Finding:** The backfill endpoint authorises by role only (`[Authorize(Roles="Owner,Manager")]`) with no ownership check. An authenticated Owner of restaurant A can POST to `/api/v1/public/restaurants/{B-guid}/embeddings/backfill`. `BackfillEmbeddingsAsync` uses `IgnoreQueryFilters()` + explicit `WHERE restaurantId = B`, so it fetches restaurant B's menu items, fires N sequential OpenAI Embeddings API calls against them, and writes the resulting vectors back — burning shared OpenAI quota and mutating another tenant's data.  
**Fix:** Compare the authenticated user's `RestaurantId` claim against the route `restaurantId` at the top of the action; return 403 on mismatch.  
**What I did with this finding:** Confirmed as a real bug. The fix is a one-line guard in `PublicController.Backfill` — adding it to the next patch.

### MEDIUM — No query length limit on anonymous endpoint

**File:** `PublicController.cs` line 31  
**Finding:** The only validation is `string.IsNullOrWhiteSpace`. A caller can POST a 50,000-character query; it is passed verbatim to `EmbedTextAsync` (OpenAI cost proportional to length) and interpolated into the chat prompt (can exceed context window → silent 400). On a zero-auth public endpoint this is an unbounded cost/token-abuse surface.  
**Fix:** Add `[MaxLength(500)]` on `RecommendationRequest.Query`, or an explicit length check returning 400.

---

## Correctness

### HIGH — `visibleItems` filter hides every card in the fallback path

**File:** `RecommendClient.tsx` line 78  
**Finding:** The client filters returned items using `!message || message.includes(item.name.toLowerCase())`. When the backend returns a fallback message (e.g. *"AI is warming up — here are some popular dishes"*), `message` is truthy, so the filter evaluates `message.includes(item.name.toLowerCase())` — which is always false because the fallback message is a fixed generic string. Result: zero item cards are shown to every user until embeddings exist, which is the most common early-deployment state.  
**Fix:** Remove or redesign the filter. The backend already limits candidates to the relevant items; the client-side name-match adds fragility with no correctness benefit.

### HIGH — Raw MinIO storage key returned as `imageUrl` — broken images

**File:** `RecommendationService.cs` line 39 (and lines 59, 70)  
**Finding:** All three `Select` projections pass `m.ImageObjectKey` directly as `ImageObjectKey` in `RecommendedItemDto`. `MenuItemService.ToDto()` correctly calls `storage.GetPublicUrl(StorageBuckets.MenuImages, item.ImageObjectKey)` to resolve a public URL; `RecommendationService` bypasses the storage service entirely. The frontend's `<img src>` receives a raw object key like `menu-items/abc/xyz.jpg`, which is a broken relative path.  
**Fix:** Inject `IStorageService` into `RecommendationService` and call `GetPublicUrl` in the projection.

### HIGH — Fire-and-forget `EmbedItemAsync` on a Scoped `DbContext` silently loses embeddings

**File:** `MenuItemService.cs` line 102 (also 133)  
**Finding:** `_ = recommendation.EmbedItemAsync(item.Id)` is fire-and-forget. `RecommendationService` is registered as `AddScoped`, sharing the HTTP request's DI scope. The HTTP response is sent in <1s; the scope is disposed. `EmbedItemAsync` takes up to 15s (OpenAI round-trip). When the async continuation resumes and calls `db.SaveChangesAsync()` on the disposed `DbContext`, an `ObjectDisposedException` is thrown — unobserved, silently lost. The embedding is never written; the item is permanently unsearchable.  
**Fix:** Register `RecommendationService` as a Singleton with its own `IDbContextFactory<DashTabDbContext>` scope, or enqueue an out-of-band Hangfire job rather than fire-and-forget from the request scope.

### MEDIUM — Null blurb returned with no fallback message when chat call fails post-embedding

**File:** `RecommendationService.cs` line 81  
**Finding:** When embedding succeeds and cosine search returns matches, but the OpenAI chat call returns 429/503, `GenerateBlurbAsync` returns null. Line 81 returns `new RecommendationResponse(null, matches)`. The frontend hides the message card when `message` is null, so the user sees recommended items with no explanatory text — different from both explicit fallback paths (which always include a message string).  
**Fix:** `blurb ?? "Here are the closest dishes to your craving:"`.

---

## Performance

### MEDIUM — `SaveChangesAsync` inside backfill loop → N transactions + N orphaned AuditLog rows

**File:** `RecommendationService.cs` line 100  
**Finding:** `SaveChangesAsync` is called on every successful embedding inside the `foreach` loop, producing N separate DB round-trips instead of one. Additionally, `DashTabDbContext.SaveChangesAsync` appends an `AuditLog` entry on every call; in the anonymous backfill context `CurrentTenantId` is null, so N AuditLog rows with `RestaurantId=Guid.Empty` are written and become permanently unqueryable by any tenant-scoped filter.  
**Fix:** Move `SaveChangesAsync` outside the loop (call once after all embeddings are written); pass a real `restaurantId` to the audit context.

### LOW — Serial OpenAI embedding calls during backfill

**File:** `RecommendationService.cs` line 93  
**Finding:** `EmbedTextAsync` is awaited sequentially. For 50 items this takes 5–15s. A `Task.WhenAll` with a `SemaphoreSlim(10)` concurrency cap would reduce wall-clock time ~10×.

---

## Code Quality

### MEDIUM — `visibleItems` string-match is fragile against LLM prose variation

**File:** `RecommendClient.tsx` line 78  
**Finding:** LLM output rarely reproduces dish names verbatim. `"Chicken Tikka Masala"` becomes `"Try our creamy Chicken Tikka"` — the substring check fails and the card is silently dropped. The `max_tokens=150` cap makes truncated names likely.

### LOW — Soft-deleted items can be embedded

**File:** `RecommendationService.cs` line 107  
**Finding:** `EmbedItemAsync` fetches with `IgnoreQueryFilters()` and no `&& !m.IsDeleted` guard. Soft-deleted items can receive embeddings, wasting an OpenAI call and leaving vectors on logically non-existent rows.

### LOW — Duplicate fallback DB query

**File:** `RecommendationService.cs` lines 34–44 and 65–75  
**Finding:** Nearly identical `Take(4)` fallback queries appear twice. Extract to a `GetFallbackItemsAsync(Guid restaurantId, CancellationToken ct)` helper.

### LOW — Config keys re-read per call

**File:** `RecommendationService.cs`  
**Finding:** `_config["OpenAI:ApiKey"]` (and other config values) are read from `IConfiguration` on every method call. Bind to a typed options class (`IOptions<OpenAiOptions>`) in the constructor.

---

## Standout Positives

- **Tenant isolation on the anonymous `Recommend` path is correct.** Every DB query uses `IgnoreQueryFilters()` + explicit `WHERE m.RestaurantId == restaurantId`. There is no code path where another restaurant's items can appear in a recommendation response.
- **Fail-soft OpenAI wrappers.** Both `EmbedTextAsync` and `GenerateBlurbAsync` catch all exceptions and return null rather than propagating — OpenAI outages cannot crash the public endpoint.
- **pgvector cosine distance in SQL.** `ORDER BY embedding <=> ...` via `CosineDistance()` pushes the similarity computation into PostgreSQL and uses the HNSW index. No in-memory sort, no N+1.
- **Feature flag gating at both layers.** The Unleash flag is checked at the backend (`PublicController` line 28, returns 503) and at the SSR page (`page.tsx`, returns "Coming Soon" on first byte). Correct fail-open fallback in both.
- **Three distinct graceful-degradation paths** (no key, no embeddings, chat failure) with different user messages is thoughtful defensive design.

---

## What I did with this feedback

| Finding | Action |
|---|---|
| Backfill IDOR | Confirmed real bug — adding ownership guard in next patch |
| `visibleItems` filter | Removed the name-match filter; backend result set is already correct |
| Raw MinIO key as imageUrl | Injected `IStorageService` into `RecommendationService`, resolved URLs in all three projections |
| Fire-and-forget scoped DbContext | Converted to a Hangfire background job enqueued from `MenuItemService` |
| Null blurb | Added static fallback string |
| Query length | Added `[MaxLength(500)]` on `RecommendationRequest.Query` |
| `SaveChangesAsync` in loop | Moved outside loop; added `restaurantId` to audit context |
| Soft-deleted guard | Added `&& !m.IsDeleted` to `EmbedItemAsync` predicate |
