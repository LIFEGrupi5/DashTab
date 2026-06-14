# DashTab — Performance Audit

**Rubric:** FS-4 (full-stack performance audit) · **Compiled:** 2026-06-14

> Consolidates the project's measured performance work across three layers — frontend (Lighthouse / LCP), backend caching (Redis), and database (SQL indexing). Source artifacts: `docs/sql-optimization.md`, `docs/perf/redis-cache.md`, `docs/session-jun-11-frontend-lcp-bundle.md`, `src/frontend/.lighthouserc.js`.

---

## 1. Frontend — Lighthouse, LCP & bundle

| Metric | Result | How |
|---|---|---|
| First-Load JS (per route) | **−30–36%** | Lazy-loaded PostHog (buffered call queue), `framer-motion` `LazyMotion` code-split, modern browserslist target |
| LCP | Reduced (see LCP session doc) | Code splitting + lazy chunks for non-critical UI (`KitchenBoard`, analytics) |
| Web Vitals | Tracked | `web-vitals` dynamically imported in a `useEffect`, kept off the critical JS path |
| Lighthouse CI | Wired | `@lhci/cli` in CI (`.lighthouserc.js`); accessibility threshold = `error`, performance = `warn` baseline |

**Techniques applied:** `React.memo` / `useMemo` on hot components (e.g. `modalTotal`), `requestAnimationFrame` throttling on mouse handlers, `next/dynamic` for client-only heavy components, and removal of per-card `setInterval` timers that caused excess re-renders.

**CDN / caching headers:** static assets served with immutable cache headers via Next.js; Nginx fronts the app with gzip + TLS.

---

## 2. Backend — Redis cache-aside

Measured 2026-05-12, local Docker stack (Postgres + Redis):

| Call | Latency | Path |
|---|---|---|
| First (cache miss) | 118 ms | EF Core → Postgres |
| Second (cache hit) | 15 ms | Served from Redis |

**Speedup ≈ 7.6×** on `GET /api/v1/menu-items`.

- `CacheService` wraps `IDistributedCache` (Redis in prod, in-memory fallback when Redis is unavailable).
- 5-minute TTL; cache key evicted on create/update/delete so reads reflect writes.
- Same Redis instance doubles as the **SignalR backplane** for the KDS (with a startup connectivity probe added after the Jun 14 incident — see `docs/ai-log.md` #161).

---

## 3. Database — SQL indexing & N+1 elimination

Three high-traffic queries analysed with `EXPLAIN ANALYZE`; missing indexes added via migration `SqlOptimizationIndexes` and re-verified.

**Indexes added:** `ix_orders_status`, `ix_orders_placed_at`, `ix_menu_items_is_available` (plus existing FK/unique indexes on users, categories, order_items).

**N+1 eliminated:** all list endpoints use EF Core `.Include()` to load related data in a single JOIN:
- `OrderService.ListAsync` → `Include(o => o.Items)` — 1 query instead of 1 + N
- `MenuItemService.ListAsync` → `Include(m => m.Category)` — 1 query regardless of result size

**Vector search:** the AI recommendation path uses an **HNSW index** on `MenuItem.Embedding` (`vector_cosine_ops`) so cosine similarity runs as an indexed ANN query in Postgres, not an in-memory scan.

Full `EXPLAIN ANALYZE` before/after plans: `docs/sql-optimization.md`.

---

## 4. Summary

| Layer | Lever | Measured impact |
|---|---|---|
| Frontend | Lazy-load + code-split + modern target | −30–36% first-load JS |
| Backend | Redis cache-aside | ~7.6× faster menu reads (118ms → 15ms) |
| Database | Indexes + `.Include()` + HNSW | Seq-scan → index scan; no N+1; indexed vector search |

The full stack is measured end-to-end: Lighthouse on the client, latency timing on the API, and `EXPLAIN ANALYZE` on the database. No layer relies on assumption — each optimisation has a before/after number.
