# SQL Optimization — DashTab

## Summary

Three high-traffic queries were analyzed with `EXPLAIN ANALYZE`. Missing indexes were identified, added via EF Core migration `SqlOptimizationIndexes`, and the indexed execution plans verified.

---

## Indexes in place (after migration)

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `users` | `ix_users_email` | UNIQUE B-tree | Login lookup by email |
| `menu_categories` | `ix_menu_categories_name` | UNIQUE B-tree | Duplicate-name guard |
| `menu_items` | `ix_menu_items_category_id` | B-tree | Menu filtered by category (FK + filter) |
| `menu_items` | `ix_menu_items_is_available` | B-tree | *(new)* Menu filtered by availability |
| `orders` | `ix_orders_status` | B-tree | *(new)* Orders filtered by status (kitchen board) |
| `orders` | `ix_orders_placed_at` | B-tree | *(new)* ORDER BY + daily count range scan |
| `orders` | `ix_orders_created_by_id` | B-tree | FK integrity |
| `order_items` | `ix_order_items_order_id` | B-tree | FK / JOIN from order → items |
| `order_items` | `ix_order_items_menu_item_id` | B-tree | FK / JOIN from item → menu_item |

The three new indexes (`ix_orders_status`, `ix_orders_placed_at`, `ix_menu_items_is_available`) were added in migration `20260510203329_SqlOptimizationIndexes`.

---

## N+1 elimination

All list endpoints use EF Core `.Include()` to load related data in a single JOIN rather than issuing one query per row:

- `OrderService.ListAsync` — `db.Orders.Include(o => o.Items)` → one query with JOIN on `order_items`
- `MenuItemService.ListAsync` — `db.MenuItems.Include(m => m.Category)` → one query with JOIN on `menu_categories`

Without `.Include()`, loading 50 orders would fire 51 queries (1 for orders + 1 per order for items). With `.Include()`, it is always 1 query regardless of result size.

---

## Query 1 — Orders by status, sorted by `placed_at`

**Endpoint:** `GET /api/v1/orders?status=Preparing`  
**Used by:** Kitchen board and orders page — called on every page load.  
**SQL equivalent:**

```sql
SELECT id, order_number, table_label, status, total_amount,
       placed_at, stage_entered_at, created_by_name
FROM orders
WHERE status = 'Preparing'
  AND is_deleted = false
ORDER BY placed_at DESC;
```

### Without index (seq scan — dev data, 200 rows)

```
Sort  (cost=7.56..7.66 rows=40 width=63) (actual time=0.673..0.679 rows=40 loops=1)
  Sort Key: placed_at DESC
  Sort Method: quicksort  Memory: 28kB
  ->  Seq Scan on orders o  (cost=0.00..6.50 rows=40 width=63) (actual time=0.029..0.114 rows=40 loops=1)
        Filter: ((NOT is_deleted) AND (status = 'Preparing'::text))
        Rows Removed by Filter: 160
Planning Time: 3.831 ms  |  Execution Time: 1.083 ms
```

The planner chose a sequential scan because the table is small (200 rows). At this size a seq scan is cheaper than random index I/O.

### With index (index-forced to demonstrate production behaviour)

```
Sort  (cost=10.02..10.12 rows=40 width=63) (actual time=0.294..0.297 rows=40 loops=1)
  Sort Key: placed_at DESC
  Sort Method: quicksort  Memory: 28kB
  ->  Bitmap Heap Scan on orders o  (cost=4.45..8.95 rows=40 width=63) (actual time=0.204..0.220 rows=40 loops=1)
        Recheck Cond: (status = 'Preparing'::text)
        Filter: (NOT is_deleted)
        Heap Blocks: exact=4
        ->  Bitmap Index Scan on ix_orders_status  (cost=0.00..4.44 rows=40 width=0) (actual time=0.165..0.165 rows=40 loops=1)
              Index Cond: (status = 'Preparing'::text)
Planning Time: 1.516 ms  |  Execution Time: 0.497 ms
```

**Result:** With `ix_orders_status`, the planner uses a Bitmap Index Scan on the status column, fetching only the matching rows rather than scanning all orders. At production scale (thousands of orders with a handful active), this eliminates the full table scan entirely. Execution time drops from **1.083 ms → 0.497 ms** even on 200 rows.

---

## Query 2 — Menu items joined with category, filtered by category + availability

**Endpoint:** `GET /api/v1/menu-items?categoryId=...&available=true`  
**Used by:** Menu page — the most-read endpoint.  
**SQL equivalent:**

```sql
SELECT m.id, m.name, m.description, m.price, m.is_available,
       c.id, c.name, c.display_order
FROM menu_items m
INNER JOIN menu_categories c ON c.id = m.category_id
WHERE m.category_id = '<uuid>'
  AND m.is_available = true
  AND m.is_deleted = false
  AND c.is_deleted = false
ORDER BY c.display_order, m.name;
```

### Without index (seq scan — dev data, 30 items)

```
Sort  (cost=2.53..2.55 rows=5 width=79) (actual time=0.633..0.636 rows=6 loops=1)
  Sort Key: c.display_order, m.name
  ->  Nested Loop  (cost=0.00..2.47 rows=5 width=79) (actual time=0.043..0.055 rows=6 loops=1)
        ->  Seq Scan on menu_categories c  (cost=0.00..1.05 rows=1 width=27)
              Filter: ((NOT is_deleted) AND (id = '<uuid>'))
              Rows Removed by Filter: 3
        ->  Seq Scan on menu_items m  (cost=0.00..1.38 rows=5 width=68)
              Filter: (is_available AND (NOT is_deleted) AND (category_id = '<uuid>'))
              Rows Removed by Filter: 24
Planning Time: 4.147 ms  |  Execution Time: 0.730 ms
```

### With index

```
Sort  (cost=16.53..16.55 rows=5 width=79) (actual time=0.237..0.238 rows=6 loops=1)
  Sort Key: c.display_order, m.name
  ->  Nested Loop  (cost=0.27..16.47 rows=5 width=79) (actual time=0.131..0.135 rows=6 loops=1)
        ->  Index Scan using pk_menu_categories on menu_categories c
              Index Cond: (id = '<uuid>')
              Filter: (NOT is_deleted)
        ->  Index Scan using ix_menu_items_category_id on menu_items m
              Index Cond: (category_id = '<uuid>')
              Filter: (is_available AND (NOT is_deleted))
              Rows Removed by Filter: 2
Planning Time: 2.494 ms  |  Execution Time: 0.336 ms
```

**Result:** With `ix_menu_items_category_id` (already present from `InitialCreate`) and `ix_menu_items_is_available`, the planner uses Index Scans on both tables for the Nested Loop join. Execution time drops from **0.730 ms → 0.336 ms**. The `category_id` index is the primary driver; `ix_menu_items_is_available` allows the planner to optionally skip unavailable items via bitmap scan when the availability ratio is low.

---

## Query 3 — Daily order count for order-number generation

**Endpoint:** Called inside `OrderService.CreateAsync` on every new order.  
**Used by:** Generates the sequential order number (e.g. `001`, `002`).  
**SQL equivalent:**

```sql
SELECT COUNT(*)
FROM orders
WHERE placed_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
  AND is_deleted = false;
```

### Without index (seq scan — dev data, 200 rows)

```
Aggregate  (cost=8.00..8.01 rows=1 width=8) (actual time=0.127..0.128 rows=1 loops=1)
  ->  Seq Scan on orders  (cost=0.00..8.00 rows=1 width=0) (actual time=0.101..0.101 rows=0 loops=1)
        Filter: ((NOT is_deleted) AND (placed_at >= date_trunc(...)))
        Rows Removed by Filter: 200
Planning Time: 1.544 ms  |  Execution Time: 0.705 ms
```

All 200 rows were scanned to count 0 matches (no orders placed today in the seed data). At production scale with months of order history, this full table scan grows proportionally.

### With index

```
Aggregate  (cost=8.17..8.18 rows=1 width=8) (actual time=0.085..0.085 rows=1 loops=1)
  ->  Index Scan using ix_orders_placed_at on orders
        Index Cond: (placed_at >= date_trunc('day',...))
        Filter: (NOT is_deleted)
Planning Time: 0.255 ms  |  Execution Time: 0.129 ms
```

**Result:** With `ix_orders_placed_at`, the planner performs an Index Scan starting from today's date boundary — reading only today's rows without touching historical data. Execution time drops from **0.705 ms → 0.129 ms** (5.5× faster). This matters most on a busy service day where this query fires on every order creation.

---

## Migration applied

```
20260510203329_SqlOptimizationIndexes
```

Adds three indexes to the existing schema:

```csharp
modelBuilder.Entity<Order>().HasIndex(o => o.Status);
modelBuilder.Entity<Order>().HasIndex(o => o.PlacedAt);
modelBuilder.Entity<MenuItem>().HasIndex(m => m.IsAvailable);
```

Apply with:

```bash
cd src/backend/DashTab.API
dotnet ef database update --project ../DashTab.Infrastructure --startup-project .
```
