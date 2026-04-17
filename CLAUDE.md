# DashTab — Root

DashTab is a restaurant operating system covering POS, payments, inventory, analytics, menu/staff/table management.

## Monorepo Structure

```
src/
  backend/   # .NET 10 Clean Architecture — see src/backend/CLAUDE.md
  frontend/  # Next.js 15 + TypeScript   — see src/frontend/CLAUDE.md
devops/      # Docker, k8s, CI/CD        — see devops/CLAUDE.md
docs/        # Architecture decisions and documentation
```

## Tech Stack

| Layer   | Technology                         |
|---------|------------------------------------|
| Frontend | Next.js 15, TypeScript, Tailwind  |
| Backend  | .NET 10, Clean Architecture       |
| DevOps   | Docker, Kubernetes (Kustomize)    |

## Git Conventions

- Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`
- PRs target `main` and require passing CI before merge
- Keep commits scoped — one logical change per commit
