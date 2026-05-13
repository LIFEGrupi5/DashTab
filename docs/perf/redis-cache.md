# Redis Cache Performance — GET /api/v1/menu-items

Measured on 2026-05-12, local Docker stack (Postgres + Redis on localhost).

## Results

| Call | Latency | Notes |
|------|---------|-------|
| First (cache miss) | 118 ms | EF Core query → Postgres |
| Second (cache hit) | 15 ms | Served from Redis |

**Speedup: ~7.6×**

## How caching works

`CacheService` wraps `IDistributedCache` (Redis in production, in-memory fallback when Redis is unavailable).

`MenuItemService.ListAsync()` checks the cache before hitting the database:

1. Cache miss → query Postgres, serialize result, write to Redis with a 5-minute TTL
2. Cache hit → deserialize and return directly, no DB round-trip

On write operations (create, update, delete) the cache key is evicted so the next read reflects the new state.

## Configuration

| Setting | Value |
|---------|-------|
| Cache key | `menu-items:all` |
| TTL | 5 minutes |
| Redis connection | `ConnectionStrings:Redis` in appsettings |
| Fallback | In-memory (`AddDistributedMemoryCache`) when Redis is not configured |
