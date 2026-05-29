# Frontend — Next.js 15 + TypeScript

## Running

```bash
cd src/frontend
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Project Layout

```
src/frontend/
  app/
    layout.tsx                   # Root layout (metadata, global CSS, providers)
    page.tsx                     # Redirects to /dashboard
    _components/                 # App-scoped shared components
    (auth)/
      login/page.tsx             # Login (real backend auth)
    (dashboard)/
      layout.tsx                 # Sidebar navigation
      dashboard/page.tsx         # KPI overview
      orders/page.tsx            # Order management
      orders/new/page.tsx        # Create new order
      menu/page.tsx              # Menu management
      kitchen/page.tsx           # Kitchen Kanban board (real-time via SignalR)
      overview/page.tsx          # Analytics & charts
      staff/page.tsx             # Staff management
  components/                    # Shared UI components
  hooks/                         # Custom React hooks (useAuth, useMenu, useOrders, useKdsSignalR, ...)
  lib/
    api/                         # Typed API clients (auth, menu, orders, staff) + client/jwt helpers
    orders/                      # Order helpers (kitchenTimes.ts)
    queryKeys.ts                 # React Query key factory
    schemas.ts                   # Zod schemas
  stores/                        # Zustand store (useAppStore.ts — auth + UI state)
  types/                         # Shared TS interfaces (most API types live in lib/api/types.ts)
  styles/                        # Additional global stylesheets
  public/                        # Static assets
  tests/
    unit/                        # Jest + RTL unit tests
    e2e/                         # Playwright end-to-end tests
```

## Path Alias

`@/` maps to `src/frontend/` — use for all internal imports:
```ts
import { Button } from '@/components/Button'
```

## Component Conventions

- Components live in `components/` and are plain `.tsx` files (no barrel index files yet)
- Variants and sizes currently use prop unions; `class-variance-authority` is installed but not yet adopted — match existing components
- Tailwind only — no inline styles or CSS modules
- UI primitives: Radix UI (`@radix-ui/react-*`) + Lucide icons
- Toasts: `sonner`, Theming: `next-themes`

## Data & State

- **Server state:** TanStack React Query (`@tanstack/react-query`); query keys in `lib/queryKeys.ts`, fetchers in `lib/api/`
- **Client state:** Zustand (`stores/useAppStore.ts`) — auth + UI, persisted to localStorage
- **Auth:** real Keycloak-backed login; JWT decoded in `lib/api/jwt.ts`, refresh handled in `lib/api/client.ts`
- **Real-time:** `@microsoft/signalr` via `hooks/useKdsSignalR.ts` drives the kitchen board (orderPlaced / orderStatusChanged / orderCancelled)
- Pages call the **real backend**; configure it with `NEXT_PUBLIC_API_URL` (+ `NEXT_PUBLIC_KEYCLOAK_*`)

## Key Packages

| Package | Purpose |
|---------|---------|
| `next` 15 + `react` 19 | Framework (App Router) |
| `@tanstack/react-query` | Server-state fetching/caching |
| `zustand` | Client state store |
| `@microsoft/signalr` | KDS real-time updates |
| `react-hook-form` + `zod` (`@hookform/resolvers`) | Forms + validation |
| `recharts` | Charts (overview page) |
| `framer-motion` | Animations |
| `tailwind-merge` + `clsx` | Class name utilities |
| `@tailwindcss/container-queries` | Container-based responsive styles |

## Testing

- Unit: Jest + React Testing Library (+ `jest-axe` for a11y) — `npm test`
- E2E: Playwright — `npm run test:e2e`
