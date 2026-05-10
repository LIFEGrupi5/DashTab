# Session — May 8, 2026: Phase 3A Redis Cache + Keycloak Auth Debugging

## What We Did

### 1. Phase 3A — Redis Cache-Aside on Menu

Implemented read-through caching on the four menu endpoints using the cache-aside pattern. Redis was already provisioned in docker-compose and the `StackExchange.Redis` NuGet package was already referenced, but no code used either.

**Files created:**
- `DashTab.Application/Interfaces/ICacheService.cs` — abstraction (Get/Set/Remove/RemoveMany)
- `DashTab.Infrastructure/Caching/CacheService.cs` — implementation wrapping `IDistributedCache`; all operations wrapped in try/catch so Redis failures never surface as API errors (fail-open)
- `DashTab.Infrastructure/Caching/CacheKeys.cs` — centralized key builders (`menu:items:all`, `menu:items:cat:{id}`, `menu:item:{id}`, `menu:categories`, `menu:category:{id}`)

**Files modified:**
- `DashTab.Infrastructure/DashTab.Infrastructure.csproj` — added `Microsoft.Extensions.Caching.StackExchangeRedis 9.0.4`
- `DashTab.API/Program.cs` — registers `AddStackExchangeRedisCache` when `ConnectionStrings:Redis` is present, falls back to `AddDistributedMemoryCache` for local dev without Docker; registers `ICacheService` as singleton
- `DashTab.Infrastructure/Services/MenuItemService.cs` — cache-aside on `ListAsync` (skips cache when `search` or `available` filter is present), `GetByIdAsync`; invalidates relevant keys on every write
- `DashTab.Infrastructure/Services/CategoryService.cs` — same pattern; category writes also cascade-invalidate item list caches because `MenuItemDto.Category` (name) is denormalized

**TTLs:** items = 5 min, categories = 15 min. Filtered calls (`?search=`, `?available=`) bypass cache entirely.

---

### 2. Keycloak Debugging (three separate issues found during verification)

After implementing the cache, we tried to verify it with `curl`. Every request returned `401 Unauthorized`. Debugging uncovered three layered problems:

---

#### Problem 1 — `dashtab` realm didn't exist

**Symptom:** `curl http://localhost:8080/realms/dashtab/...` returned `{"error":"Realm does not exist"}`.

**Root cause:** Keycloak's `--import-realm` flag only imports the realm if it doesn't already exist in the database. Since the Postgres `keycloak` database already had state from a previous run (the container was not started fresh), Keycloak skipped the import on every subsequent restart, leaving only the `master` realm.

**Fix:** Manually imported the realm via the Keycloak admin REST API:
```bash
ADMIN_TOKEN=$(curl -s http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "grant_type=password&client_id=admin-cli&username=admin&password=admin_dev" \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

curl -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @devops/keycloak/realm-export.json
# → 201 Created
```

The realm now persists in Postgres and survives container restarts.

---

#### Problem 2 — JWT issuer mismatch

**Symptom:** Login succeeded (200) but `GET /api/v1/menu-categories` returned `401` with `WWW-Authenticate: Bearer error="invalid_token", error_description="The issuer 'http://localhost:8080/realms/dashtab' is invalid"`.

**Root cause:** The token's `iss` claim is always stamped with Keycloak's `KC_HOSTNAME` — which is set to `localhost` — giving `iss: http://localhost:8080/realms/dashtab`. But the API (inside Docker) had `Keycloak__Authority: http://keycloak:8080/realms/dashtab`. ASP.NET Core's JWT Bearer middleware derived its expected issuer from the Authority URL, so the two never matched.

**Fix:** Added a `Keycloak__ValidIssuer: http://localhost:8080/realms/dashtab` env var to the backend service in `docker-compose.yml`, and in `Program.cs` used it to explicitly set `opts.TokenValidationParameters.ValidIssuer`. This decouples the URL used to *fetch* the OIDC discovery document (internal `keycloak:8080`) from the URL accepted in the token's `iss` claim (public `localhost:8080`).

---

#### Problem 3 — JWKS unreachable from inside Docker

**Symptom:** After fixing the issuer, the response changed to `WWW-Authenticate: Bearer error="invalid_token", error_description="The signature key was not found"`.

**Root cause:** Keycloak always embeds its `KC_HOSTNAME` in the OIDC discovery document, including the `jwks_uri` field. Even when the API fetches discovery from `http://keycloak:8080/...`, the returned `jwks_uri` is `http://localhost:8080/realms/dashtab/protocol/openid-connect/certs`. From inside a Docker container, `localhost` resolves to the container itself — port 8080 is not open there — so the JWKS fetch silently fails and the middleware has no signing keys to validate against.

Verified by running discovery from inside the Docker network:
```bash
docker run --rm --network docker_default alpine/curl:latest \
  curl -s http://keycloak:8080/realms/dashtab/.well-known/openid-configuration \
  | grep -o '"jwks_uri":"[^"]*"'
# → "jwks_uri":"http://localhost:8080/realms/dashtab/protocol/openid-connect/certs"
```

Attempts to fix via Keycloak config (`KC_HOSTNAME_STRICT_BACKCHANNEL: "false"` → `KC_HOSTNAME_BACKCHANNEL_DYNAMIC: "true"`) had no effect — Keycloak 25 continued returning `localhost:8080` for all discovery URLs regardless of the request hostname.

**Fix:** Added a `KeycloakBackchannelHandler` in `Program.cs` — a custom `HttpClientHandler` that rewrites any URL starting with the public Keycloak base (`http://localhost:8080/realms/dashtab`) to the internal Docker base (`http://keycloak:8080/realms/dashtab`) before the request is made. It is set as `opts.BackchannelHttpHandler` on the JWT Bearer options. This transparently fixes both the discovery fetch and the JWKS fetch without requiring any Keycloak reconfiguration.

```csharp
class KeycloakBackchannelHandler(string publicBase, string internalBase) : HttpClientHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        var uri = request.RequestUri?.ToString();
        if (!string.IsNullOrEmpty(uri) && uri.StartsWith(publicBase))
            request.RequestUri = new Uri(uri.Replace(publicBase, internalBase));
        return base.SendAsync(request, ct);
    }
}
```

The handler is only attached when `Keycloak:ValidIssuer` differs from `Keycloak:Authority`, so local dev (no Docker, both point to `localhost`) is unaffected.

---

## End State

After all fixes:
- `GET /api/v1/menu-categories` returns 200 with data
- `GET /api/v1/menu-items` returns 200 with data
- `redis-cli KEYS 'menu:*'` shows `menu:categories` (TTL ~900) and `menu:items:all` (TTL ~300) after the first calls
- Filtered calls (`?search=...`) leave no new Redis keys

## Seed Credentials (for future reference)

The realm-export.json at `devops/keycloak/realm-export.json` seeds these users:

| Email | Password | Role |
|---|---|---|
| `owner@dashtab.dev` | `Owner1!` | Owner |
| `manager@dashtab.dev` | `Manager1!` | Manager |
| `waiter@dashtab.dev` | `Waiter1!` | Waiter |
| `kitchen@dashtab.dev` | `Kitchen1!` | Kitchen |

If the realm is missing after a fresh Keycloak start, import it via:
```bash
ADMIN_TOKEN=$(curl -s http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "grant_type=password&client_id=admin-cli&username=admin&password=admin_dev" \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
curl -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @devops/keycloak/realm-export.json
```

## Lessons Learned

1. **Keycloak `--import-realm` is a first-boot-only operation.** If the Postgres `keycloak` database already exists, the realm import is silently skipped on every restart. Keep the import command above in the team runbook.
2. **In Docker, token `iss` and the API's `Authority` will differ by hostname** (`localhost` vs the service name). Always decouple them: use `Authority` for fetching OIDC discovery/JWKS, and `ValidIssuer` for accepting the token's `iss` claim.
3. **Keycloak always puts its `KC_HOSTNAME` in the discovery doc** (`jwks_uri`, `issuer`, etc.), even when called from an internal Docker hostname. The `KC_HOSTNAME_BACKCHANNEL_DYNAMIC` flag exists to fix this but had no effect in Keycloak 25 in our setup. `BackchannelHttpHandler` URL rewriting is a reliable in-code alternative that requires zero Keycloak reconfiguration.
4. **Debug 401s by reading `WWW-Authenticate` response headers**, not just the status code. The `error_description` field tells you exactly which validation failed (`invalid_token` + issuer message vs. `invalid_token` + signature message are two completely different root causes).
5. **Fail-open caching is correct for read-optimization caches.** Redis being down should never cause a 5xx. Swallowing cache exceptions and treating them as cache misses keeps the API functional; a warning log is enough for ops visibility.
