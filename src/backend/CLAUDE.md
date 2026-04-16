# Backend — .NET 10 Clean Architecture

## Project Layout

```
src/backend/
  DashTab.Domain/          # Entities, value objects, domain logic — no external dependencies
  DashTab.Application/     # Use cases, DTOs, interfaces — depends on Domain only
  DashTab.Infrastructure/  # EF Core, external services — implements Application interfaces
  DashTab.API/             # Controllers, middleware, DI wiring — depends on all layers
```

Dependency direction: `API → Infrastructure → Application → Domain`

## Running the API

```bash
cd src/backend/DashTab.API
dotnet run
```

- HTTP:  http://localhost:5129
- HTTPS: https://localhost:7156
- OpenAPI: https://localhost:7156/openapi (development only)

## Current State

- `DashTab.API` is scaffolded with a demo `WeatherForecastController` — replace with real controllers
- `DashTab.Application`, `DashTab.Domain`, `DashTab.Infrastructure` are empty — ready to implement
- No database, authentication, or business logic yet

## Conventions

- Each layer is its own `.csproj`; add project references explicitly (never skip a layer)
- Controllers are thin — no business logic, only HTTP concerns
- All business logic lives in Application use cases
- Domain has zero infrastructure dependencies
- Use `IRepository<T>` interfaces in Application, implement in Infrastructure
