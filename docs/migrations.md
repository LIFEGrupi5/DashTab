# Database Migrations

## Setup

Migrations live in `src/backend/DashTab.Infrastructure/Migrations/`.  
The DbContext is `DashTabDbContext` in `DashTab.Infrastructure`.  
Commands must be run from `src/backend/DashTab.API/` (startup project).

Make sure the Postgres container is running before applying:
```bash
cd devops/docker
docker compose up -d postgres
```

## Add a new migration

```bash
cd src/backend/DashTab.API
dotnet ef migrations add <MigrationName> --project ../DashTab.Infrastructure --startup-project .
```

Example:
```bash
dotnet ef migrations add AddMenuItemImageUrl --project ../DashTab.Infrastructure --startup-project .
```

## Apply migrations to the database

```bash
cd src/backend/DashTab.API
dotnet ef database update --project ../DashTab.Infrastructure --startup-project .
```

## Rollback to a specific migration

```bash
dotnet ef database update <MigrationName> --project ../DashTab.Infrastructure --startup-project .
```

## List all migrations and their status

```bash
dotnet ef migrations list --project ../DashTab.Infrastructure --startup-project .
```

## Migration history

| Migration | Date | Description |
|---|---|---|
| `InitialCreate` | 2026-05-05 | All core tables: users, menu_categories, menu_items, orders, order_items, audit_logs |
| `AuditLogOldNewValues` | 2026-05-06 | Replace `diff` column with `old_values` + `new_values` on audit_logs |
