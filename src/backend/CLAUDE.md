# Backend — .NET 10 Clean Architecture

## Project Layout

```
src/backend/
  DashTab.Domain/
    Entities/       # Core business objects (e.g. Order.cs)
    Enums/          # Domain enumerations (e.g. OrderStatus.cs)
  DashTab.Application/
    Interfaces/     # Service interfaces (e.g. IOrderService.cs)
    Dtos/           # Request/response shapes (e.g. OrderDto.cs)
  DashTab.Infrastructure/
    Persistence/    # AppDbContext — swap to EF Core when DB is configured
    Services/       # Service implementations (e.g. OrderService.cs)
  DashTab.API/
    Controllers/    # Thin HTTP controllers
    Program.cs      # DI wiring and middleware
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

- All 4 projects scaffolded with stub examples based on `Order`
- `AppDbContext` is a plain class placeholder — not connected to a real database yet
- No authentication or real business logic yet
- Docker runs API + PostgreSQL + Redis

## Conventions

- Each layer is its own `.csproj`; add project references explicitly (never skip a layer)
- Controllers are thin — no business logic, only HTTP concerns
- Service interfaces (`IXxxService`) live in `Application/Interfaces/`
- Service implementations (`XxxService`) live in `Infrastructure/Services/` — they depend on `AppDbContext`
- DTOs live in `Application/Dtos/` — controllers and services pass DTOs, never raw entities
- Domain has zero external dependencies

## MCP server

`DashTab.API` exposes an MCP server at `/mcp` (Streamable HTTP). Tools live in
`DashTab.API/Mcp/` and are auto-discovered via `[McpServerToolType]`. Auth is
the same Keycloak JWT used by REST + SignalR, role-gated to
`Owner,Manager,Kitchen`. See `docs/mcp-integration.md` for the build-out and
how to connect a client.
