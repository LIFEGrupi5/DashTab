# Session — Jun 14, 2026: KDS WebSocket 1011 + Multi-Tenant Demo Fix

## What We Did

Diagnosed and fixed two separate production bugs both visible on the deployed
`project-05` app:

1. **Staff demo accounts saw no data at all** — owner worked, every other role was blank.
2. **KDS WebSocket kept dying with close code 1011** — the kitchen board never stayed connected.

Also fixed a latent role-claim bug that silently broke per-role schedule scoping,
and added a substantial batch of backend and frontend unit tests.

Branch: `fix/kds-redis-backplane-1011` (off the previous `fix/frontend/clear-cache-on-account-switch` work).

---

## Bug 1 — Staff Saw No Data

### Root cause

The multi-tenant architecture resolves a user's restaurant by looking up their
row in the application `users` table (by Keycloak `sub`, then by email fallback).
If no row is found, `CurrentTenantId` stays `null` and EF Core's global query
filters (`RestaurantId == CurrentTenantId`) return zero rows on every entity —
orders, menu, schedule, analytics. The response is still HTTP 200; the body is
just empty.

The three staff demo accounts (`manager@dashtab.dev`, `waiter@dashtab.dev`,
`kitchen@dashtab.dev`) existed only in Keycloak — they had **no matching row in
the `users` table**. The owner (`owner@dashtab.dev`) had been created through the
registration flow and had a row linked to the Default Restaurant (`00000000…`).

This was confirmed directly from the live database:

```
SELECT email, role, restaurant_id FROM users WHERE email LIKE '%@dashtab.dev';
-- only owner@dashtab.dev was present
```

### Why the design is correct

Staff created through the normal "Add staff" UI always get a `users` row (stamped
with the owner's `restaurant_id` via `UserService.CreateAsync`). The demo accounts
bypassed this path because they were seeded via a Keycloak realm export — not
through the app. The realm config comment already documented this:

> "prod ships NO seed `users` (owners self-register through the app), while local
> keeps demo logins for dev convenience."

### Fix applied

Inserted `users` rows for the three staff accounts directly into the live
Postgres, using their real Keycloak `sub` UUIDs (fetched from the `user_entity`
table in the `keycloak` database) so the `sub`-based lookup takes priority:

```sql
INSERT INTO users (id, full_name, email, role, is_active, created_at, updated_at, is_deleted, restaurant_id)
VALUES
  ('e3162a45-...','Demo Manager','manager@dashtab.dev','Manager',true,now(),now(),false,'00000000-...'),
  ('a573cb88-...','Demo Waiter','waiter@dashtab.dev','Waiter',  true,now(),now(),false,'00000000-...'),
  ('f059a533-...','Demo Kitchen','kitchen@dashtab.dev','Kitchen',true,now(),now(),false,'00000000-...')
ON CONFLICT DO NOTHING;
```

All four demo accounts now resolve to the Default Restaurant (15 categories,
33 menu items, 18 orders, Active Enterprise subscription). The change takes effect
immediately — the middleware only caches successful lookups; previously it was
caching nothing for these users.

### Permanence

The data lives on the PVC-backed StatefulSet and survives pod restarts and
redeploys. It does **not** survive a full PV deletion or a cluster rebuild from
scratch (there is no code seeder). The middleware's email-fallback means the rows
keep working even if the Keycloak realm is reimported and assigns new `sub` UUIDs.

---

## Bug 2 — KDS WebSocket Close 1011 (Reconnect Storm)

### Root cause

The SignalR Redis backplane requires a working Redis connection. The deployed
`ConnectionStrings__Redis` secret contained `dashtab-redis-master:6379` — **no
password**. Redis requires authentication (`requirepass`); every Redis call from
the backplane got `NOAUTH Authentication required.`

The **distributed cache** survived this because `CacheService` silently falls back
to in-memory on any Redis error (by design, documented in Program.cs). The
**SignalR backplane has no fallback**: a failing backplane aborts every hub
connection with WebSocket close code **1011**, and the browser's
`withAutomaticReconnect()` loops forever — a reconnect storm that keeps KDS
permanently disconnected.

The issue was visible in the backend pod logs as a constant stream of:

```
StackExchange.Redis.RedisConnectionException: AuthenticationFailure … on dashtab-redis-master:6379
System.Exception: Error: NOAUTH Authentication required.
```

A previous fix commit (`6f0f298`) had addressed a different 1011 cause
(hub group-join throwing without a try/catch, and missing ingress cookie affinity
for the negotiate/WebSocket handshake), but it was not yet deployed — and it would
not have fixed this anyway.

### Live fix

Patched the `dashtab-backend-secret` directly and rolled the deployment:

```bash
kubectl patch secret dashtab-backend-secret -n project-05 \
  --type merge -p '{"stringData":{"ConnectionStrings__Redis":"dashtab-redis-master:6379,password=dashtab"}}'
kubectl rollout restart deployment/dashtab-backend -n project-05
```

Verified: 0 `NOAUTH` errors in the new pod's logs. KDS WebSocket connections now
hold.

> ⚠️ **Key Vault note:** `ConnectionStrings__Redis` is sourced from Azure Key Vault
> (`kv-dashtab-p05`) at CD deploy time. The live secret patch will be overwritten on
> the next deploy. The KV value needs to be updated to include `,password=dashtab`.

### Code fix (resilience layer)

Even with the correct secret, a Redis misconfiguration should never be able to
take KDS down again. Added a startup probe in `Program.cs` via a new
`RedisConnectivity.CanConnect` helper (`DashTab.Infrastructure/Caching/RedisConnectivity.cs`):

```csharp
// Only attach the backplane when Redis actually answers.
if (redisOptions is not null && RedisConnectivity.CanConnect(redisOptions, reason =>
        Console.Error.WriteLine($"[startup] SignalR Redis backplane disabled — {reason}. ...")))
    signalR.AddStackExchangeRedis(...);
```

The probe attempts a bounded connect + PING (`AbortOnConnectFail=true`, ~1s
timeout). If Redis is unreachable or rejects auth, the backplane is skipped and
SignalR runs with the in-memory hub lifetime manager. For the current single-replica
deployment this is **functionally equivalent**; at multiple replicas only cross-pod
broadcast fanout is lost — never a hard KDS outage.

---

## Bug 3 — `CurrentUser.Roles` Always Empty (Schedule Over-Sharing)

### Root cause

`CurrentUser.Roles` read `FindAll(ClaimTypes.Role)` — the HTTP schema URI.
Keycloak issues roles as the literal claim type `"roles"`, and the JWT bearer was
configured with `MapInboundClaims = false`, which disables the automatic claim
type remapping. So `ClaimTypes.Role` claims were never present and the property
always returned an empty list.

The only consumer was `ScheduleService` (lines 21 and 100):

```csharp
if (currentUser.Roles.Contains("Waiter") || currentUser.Roles.Contains("Kitchen"))
    query = query.Where(s => s.UserId == currentUser.Id && s.IsPublished);
```

With an empty `Roles` list this branch never ran, so **waiters and kitchen staff
saw every shift in the restaurant** instead of only their own published shifts.
`[Authorize(Roles = ...)]` attributes on controllers were unaffected because they
use `IsInRole`, which correctly reads the `RoleClaimType = "roles"` setting.

### Fix

```csharp
// Before (wrong):
public IReadOnlyList<string> Roles => User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? [];

// After (correct):
public IReadOnlyList<string> Roles => User?.FindAll("roles").Select(c => c.Value).ToList() ?? [];
```

---

## Test Coverage Added

Backend unit tests using EF Core InMemory + hand-rolled fakes (no Moq):

| Suite | Cases | What's covered |
|---|---|---|
| `CurrentUserTests` | 4 | Roles reads `"roles"` claim, ignores `ClaimTypes.Role`, `Id` reads `sub` |
| `ScheduleServiceTests` | 2 | Waiter sees only own published shifts; manager sees all |
| `RedisConnectivityTests` | 1 | Returns `false` (doesn't throw) when Redis unreachable |
| `OrderServiceTests` | 9 | Total calculation, tenant stamping, transition rules, cancel, pagination |
| `CategoryServiceTests` | 8 | Create, list ordering, update, soft-delete, guard on items present |
| `SubscriptionServiceTests` | 8 | Period-end default, active/expired checks, plan limits, DTO mapping |

Frontend unit tests (Jest + RTL):

| File | Cases | What's covered |
|---|---|---|
| `jwt.test.ts` | 5 | `decodeJwt`, role extraction, name fallback chain, default role |
| `queryKeys.test.ts` | 3 | Static keys, parameterised auth/schedule keys, null token |
| `kitchenTimes.test.ts` | 6 | Timestamp enrichment, stageEntered fallback, no-mutation guarantee |
| `useAppStore.test.ts` | 4 | Initial state, setAuth/clearAuth, toggleSidebar |

**Totals:** 78 backend (was 46, +32) · 54 frontend (was 37, +17).

---

## Files Changed

```
src/backend/
  DashTab.API/Program.cs                                    -- Redis backplane probe
  DashTab.Infrastructure/Caching/RedisConnectivity.cs       -- new: startup probe helper
  DashTab.Infrastructure/Services/CurrentUser.cs            -- fix claim type "roles"
  tests/DashTab.UnitTests/DashTab.UnitTests.csproj          -- add FrameworkReference
  tests/DashTab.UnitTests/Services/CurrentUserTests.cs      -- new
  tests/DashTab.UnitTests/Services/ScheduleServiceTests.cs  -- new
  tests/DashTab.UnitTests/Services/RedisConnectivityTests.cs-- new
  tests/DashTab.UnitTests/Services/OrderServiceTests.cs     -- new
  tests/DashTab.UnitTests/Services/CategoryServiceTests.cs  -- new
  tests/DashTab.UnitTests/Services/SubscriptionServiceTests.cs -- new

src/frontend/
  tests/unit/lib/jwt.test.ts          -- new
  tests/unit/lib/queryKeys.test.ts    -- new
  tests/unit/lib/kitchenTimes.test.ts -- new
  tests/unit/stores/useAppStore.test.ts -- new
```

Live infrastructure changes (not in code):
- `dashtab-backend-secret`: `ConnectionStrings__Redis` updated with `password=dashtab`
- `users` table: 3 rows inserted for `manager/waiter/kitchen@dashtab.dev`
