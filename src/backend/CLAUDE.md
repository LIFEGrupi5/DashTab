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
