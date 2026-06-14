# Entity-Relationship Diagram — DashTab

**Rubric:** FS-3  
**Notation:** Crow's foot (Mermaid `erDiagram`)  
**Source:** EF Core domain entities in `src/backend/DashTab.Domain/Entities/`  
**Normal form:** 3NF throughout; one deliberate denormalisation noted below  
**Generated:** 2026-06-14 (auto-derived from entity source + annotated)

---

## Diagram

```mermaid
erDiagram
    Restaurant {
        uuid    Id              PK
        string  Name
        string  Slug            "unique, URL-safe"
        bool    IsActive
        datetime CreatedAt
    }

    User {
        uuid    Id              PK
        uuid    RestaurantId    FK
        string  FullName
        string  Email
        string  Role            "enum: Owner | Manager | Waiter | KitchenStaff"
        bool    IsActive
        bool    IsDeleted       "soft-delete"
        date    HireStartDate
        string  Bio
        string  PhotoUrl
        datetime CreatedAt
        datetime UpdatedAt
    }

    MenuCategory {
        uuid    Id              PK
        uuid    RestaurantId    FK
        string  Name
        int     DisplayOrder
        bool    IsDeleted       "soft-delete"
        datetime CreatedAt
        datetime UpdatedAt
    }

    MenuItem {
        uuid    Id              PK
        uuid    RestaurantId    FK
        uuid    CategoryId      FK
        string  Name
        string  Description
        decimal Price
        bool    IsAvailable
        string  ImageObjectKey  "MinIO object key (resolved to URL via IStorageService)"
        vector  Embedding       "vector(1536) — pgvector HNSW cosine index; nullable until backfill"
        bool    IsDeleted       "soft-delete"
        datetime CreatedAt
        datetime UpdatedAt
    }

    Order {
        uuid    Id              PK
        uuid    RestaurantId    FK
        uuid    CreatedById     FK
        string  OrderNumber     "human-readable, unique per restaurant"
        string  TableLabel
        string  Status          "enum: New | Preparing | Ready | Completed | Cancelled"
        decimal TotalAmount
        string  Notes
        string  CreatedByName   "denormalised snapshot — see note below"
        datetime PlacedAt
        datetime StageEnteredAt
        bool    IsDeleted       "soft-delete"
        datetime CreatedAt
        datetime UpdatedAt
    }

    OrderItem {
        uuid    Id              PK
        uuid    OrderId         FK
        uuid    MenuItemId      FK "nullable — item may be deleted after order placed"
        string  MenuItemNameSnapshot  "denormalised — see note below"
        decimal UnitPrice            "denormalised — see note below"
        int     Quantity
        decimal LineTotal
        bool    IsDeleted
    }

    Subscription {
        uuid    Id              PK
        uuid    RestaurantId    FK
        string  Plan            "enum: Free | Starter | Pro"
        string  Status          "enum: Incomplete | Active | PastDue | Cancelled | Trialing"
        string  StripeCustomerId
        string  StripeSubscriptionId
        string  StripeSessionId
        datetime CurrentPeriodEnd
        datetime CreatedAt
        datetime UpdatedAt
    }

    WorkShift {
        uuid    Id              PK
        uuid    RestaurantId    FK
        uuid    UserId          FK
        date    WeekStartDate
        string  DayOfWeek       "enum: Monday … Sunday"
        time    StartTime
        time    EndTime
        bool    IsDayOff        "true = rest day (no StartTime/EndTime used)"
        bool    IsPublished
        datetime CreatedAt
        datetime UpdatedAt
    }

    ShiftRequest {
        uuid    Id              PK
        uuid    RestaurantId    FK
        uuid    RequesterId     FK "User who submitted the request"
        uuid    TargetUserId    FK "nullable — only for swap requests"
        string  Type            "enum: DayOff | Swap"
        string  Status          "enum: Pending | Approved | Rejected"
        date    RequestedDate
        date    TargetDate      "nullable — swap target date"
        string  Reason
        string  ManagerNote
        datetime CreatedAt
        datetime ReviewedAt     "nullable"
    }

    AuditLog {
        uuid    Id              PK
        uuid    RestaurantId    FK
        string  EntityName
        uuid    EntityId
        string  Action          "Created | Updated | Deleted"
        string  ChangedBy       "username snapshot"
        string  OldValues       "JSON"
        string  NewValues       "JSON"
        datetime ChangedAt
    }

    %% ── Relationships ──────────────────────────────────────────────────────────

    Restaurant  ||--o{  User            : "employs"
    Restaurant  ||--o{  MenuCategory    : "owns"
    Restaurant  ||--o{  MenuItem        : "owns"
    Restaurant  ||--o{  Order           : "receives"
    Restaurant  ||--|{  Subscription    : "has (exactly 1 active)"
    Restaurant  ||--o{  WorkShift       : "schedules"
    Restaurant  ||--o{  ShiftRequest    : "manages"
    Restaurant  ||--o{  AuditLog        : "audited by"

    MenuCategory  ||--o{  MenuItem  : "contains"

    Order  ||--|{  OrderItem  : "has (1+)"
    MenuItem  |o--o{  OrderItem  : "referenced by (nullable)"

    User  ||--o{  Order        : "placed by (CreatedBy)"
    User  ||--o{  WorkShift    : "assigned"
    User  ||--o{  ShiftRequest : "requested by (Requester)"
    User  |o--o{  ShiftRequest : "targeted by (TargetUser, swaps only)"
```

---

## Entity notes

### Denormalisation (intentional, 3NF exception)

`OrderItem` stores **`MenuItemNameSnapshot`** and **`UnitPrice`** as denormalised columns, and `Order` stores **`CreatedByName`**. These are **intentional** violations of strict 3NF:

- A `MenuItem` can be renamed or repriced, or soft-deleted, after an order is placed.
- An `Order` must remain an accurate historical record regardless of subsequent menu or staff changes.
- Without the snapshot, querying historical order totals would require joining to a point-in-time view that EF Core cannot express with a simple FK.

The FK `OrderItem.MenuItemId` is **nullable** for the same reason — if the item is deleted, the FK becomes null but the name and price snapshots remain.

### Soft-delete pattern

Every user-facing entity (`User`, `MenuCategory`, `MenuItem`, `Order`, `OrderItem`) has `IsDeleted bool`. A global EF Core query filter (`HasQueryFilter(e => !e.IsDeleted)`) applies to all queries by default. Hard deletes are never used; `RecommendationService` uses `IgnoreQueryFilters()` with explicit `IsDeleted = false` guards for the anonymous path.

### Multi-tenant isolation

Every table except `AuditLog` primary entities has a `RestaurantId` FK. The EF Core global filter enforces `WHERE restaurant_id = @currentTenantId` on every authenticated query. Anonymous endpoints (public recommendation) use `IgnoreQueryFilters()` + explicit `WHERE restaurant_id = @routeId` to enforce tenant scope without the ambient tenant context.

### pgvector extension (non-relational column)

`MenuItem.Embedding` is a `vector(1536)` Postgres column type provided by the `pgvector` extension. It stores the OpenAI `text-embedding-3-small` embedding for each menu item and is used for approximate nearest-neighbour cosine-similarity search (`ORDER BY embedding <=> @queryVec`). An **HNSW index** (`ix_menu_items_embedding_hnsw`) is created by migration for fast ANN queries. This column has **no relational FK** — it is a feature vector, not a reference.

---

## Migration strategy

DashTab uses **EF Core 9 code-first migrations** (`dotnet ef migrations add <Name>` / `dotnet ef database update`).

- Migrations live in `src/backend/DashTab.Infrastructure/Migrations/`.
- The app calls `Database.MigrateAsync()` on startup so every deploy applies pending migrations automatically.
- The Postgres `vector` extension is enabled by the initial migration via `migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS vector;")` — this must run **before** the `vector(1536)` column migration.
- The HNSW index is created with plain `CREATE INDEX` (not `CONCURRENTLY`) because EF Core wraps migrations in a transaction block and Postgres prohibits `CREATE INDEX CONCURRENTLY` inside a transaction. See `docs/ai-debug-session-hnsw-migration.md` for the incident where this was discovered.
- Reference: `docs/migrations.md` for the full migration history and naming conventions.
