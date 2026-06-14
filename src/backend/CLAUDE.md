# Backend — .NET 10 Clean Architecture

## Project Layout

```
src/backend/
  DashTab.Domain/
    Entities/       # Restaurant, User, MenuCategory, MenuItem (+ pgvector Embedding), Order, OrderItem,
                    #   AuditLog, Subscription, WorkShift, ShiftRequest
    Enums/          # OrderStatus, Role, SubscriptionStatus, Plan, ShiftRequestStatus, ShiftRequestType
  DashTab.Application/
    Interfaces/     # Service interfaces (IOrderService, IUserService, IScheduleService, IRecommendationService, etc.)
    Dtos/           # Request/response shapes (incl. PagedResult<T>, RecommendationDtos)
    Mappings/       # Mapperly mappers (entity <-> DTO)
    Validators/     # FluentValidation request validators
    Events/         # Domain/integration event contracts
    Storage/        # Storage policy/bucket constants
  DashTab.Infrastructure/
    Persistence/    # DashTabDbContext (EF Core 9, PostgreSQL + pgvector, multi-tenant query filters) + Migrations
    Services/       # Auth, User, Category, MenuItem, Order, Restaurant, Subscription, Schedule,
                    #   Recommendation (OpenAI), Email, Storage, Jobs
    Caching/        # Redis-backed CacheService + CacheKeys
    Messaging/      # RabbitMQ publisher, consumers, KDS bridge
    Middleware/     # RestaurantContextMiddleware (tenant resolution + 402 subscription gate)
  DashTab.API/
    Controllers/    # Auth, Users, MenuCategories, MenuItems, Orders, Restaurants, Subscriptions,
                    #   Schedule, Analytics, Public (anonymous AI recommend), Health
    Middleware/     # CorrelationIdMiddleware, DashTabExceptionHandler
    Realtime/       # SignalR KdsHub + KdsBroadcaster
    Mcp/            # MCP server tools (MenuTools, OrderTools, StaffTools) — read-only, auth-gated
    Hangfire/       # Dashboard auth filter
    Program.cs      # DI wiring and middleware pipeline
  tests/
    DashTab.UnitTests/         # xUnit unit tests (mappers, services, jobs)
    DashTab.IntegrationTests/  # Integration tests (e.g. Keycloak)
```

Dependency direction: `API → Infrastructure → Application → Domain`

## Local Secrets Setup

Connection strings are **not** in `appsettings.Development.json`. Each developer sets them via .NET user secrets (stored on your machine only, never in git):

```bash
cd src/backend/DashTab.API
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=dashtab;Username=dashtab;Password=<your_local_password>"
```

The password should match `POSTGRES_PASSWORD` in your `devops/docker/.env`.

## Running the API

**Via Docker (recommended):**
```bash
cd devops/docker
docker compose --profile backend up
```
API available at `http://localhost:5000`

**Locally:**
```bash
cd src/backend/DashTab.API
dotnet run
```

**Build the whole solution:**
```bash
cd src/backend
dotnet build
```

## Current State

- `DashTabDbContext` runs on EF Core 9 over PostgreSQL (Npgsql) + the `pgvector` extension (menu-item embeddings), with migrations, soft-delete query filters, and snake_case naming conventions
- Authentication is live via Keycloak JWT bearer; roles are `Owner, Manager, Waiter, Kitchen` and gate REST, SignalR, and MCP (most endpoints are `Owner` or `Owner,Manager`)
- Real business logic in place for auth, users, menu categories/items, orders, subscriptions (Stripe), staff scheduling, and AI menu recommendations
- List endpoints (orders, menu-items, users) are paginated via `?skip=&take=` returning `PagedResult<T>`
- AI recommendation (`PublicController`, anonymous) uses OpenAI embeddings + pgvector cosine search + an LLM blurb; **fail-soft** — missing key / API error falls back to a plain menu listing, never throws
- Subscriptions: period end is set app-side on confirm (`UtcNow + 1 month`); **Stripe webhooks are not wired**, so Stripe-side renewals are not tracked
- Cross-cutting infra wired in `Program.cs`:
  - **Redis** cache (`Caching/`, falls back to in-memory when unavailable)
  - **RabbitMQ** messaging + consumers and the kitchen bridge (`Messaging/`)
  - **MinIO** S3-compatible image storage (`Services/Storage/`)
  - **Hangfire** (PostgreSQL store) for background jobs, dashboard at `/hangfire`
  - **SignalR** KDS hub at `/hubs/kds` with optional Redis backplane
  - **Serilog** structured logging with correlation IDs
- Docker (`--profile backend`) runs API + PostgreSQL + Redis + Keycloak + RabbitMQ + MinIO + MailHog

## Key Packages

| Package | Purpose |
|---------|---------|
| `Npgsql.EntityFrameworkCore.PostgreSQL` 9 | EF Core PostgreSQL provider |
| `EFCore.NamingConventions` | snake_case mapping |
| `Riok.Mapperly` | source-generated entity ↔ DTO mapping |
| `FluentValidation.AspNetCore` | request validation |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Keycloak JWT auth |
| `Microsoft.AspNetCore.SignalR.StackExchangeRedis` | KDS realtime + backplane |
| `RabbitMQ.Client` | message broker |
| `Minio` | object storage |
| `Hangfire.AspNetCore` + `Hangfire.PostgreSql` | background jobs |
| `Pgvector` + `Pgvector.EntityFrameworkCore` | menu-item embeddings + cosine search |
| `MailKit` | SMTP email |
| `Serilog.AspNetCore` | structured logging |
| `ModelContextProtocol.AspNetCore` 1.3.0 | MCP server |

## Conventions

- Each layer is its own `.csproj`; add project references explicitly (never skip a layer)
- Controllers are thin — no business logic, only HTTP concerns
- Service interfaces (`IXxxService`) live in `Application/Interfaces/`
- Service implementations (`XxxService`) live in `Infrastructure/Services/` — they depend on `DashTabDbContext`
- DTOs live in `Application/Dtos/`; entity ↔ DTO mapping uses Mapperly mappers in `Application/Mappings/` — controllers and services pass DTOs, never raw entities
- Domain has zero external dependencies

## MCP server

`DashTab.API` exposes an MCP server at `/mcp` (Streamable HTTP). Tools live in
`DashTab.API/Mcp/` and are auto-discovered via `[McpServerToolType]`. Auth is
the same Keycloak JWT used by REST + SignalR, role-gated to
`Owner,Manager,Kitchen`. See `docs/mcp-integration.md` for the build-out and
how to connect a client.
