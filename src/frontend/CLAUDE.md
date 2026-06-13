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
    (marketing)/                 # Public marketing site — owns /
      layout.tsx                 # Public navbar (Login/Get Started) + footer
      page.tsx                   # Landing page (Hero, Features, Pricing, FAQ, CTA)
      pricing/page.tsx           # Full plan comparison
      about/page.tsx             # Team + values + tech stack
      contact/page.tsx           # Contact / demo request form
    (auth)/
      login/page.tsx             # Login (httpOnly cookie auth)
      register/page.tsx          # Restaurant registration (POST /restaurants/register)
    (dashboard)/
      layout.tsx                 # Sidebar navigation (role-based) + PostHog restaurant identity
      dashboard/page.tsx         # KPI overview
      orders/page.tsx            # Order management
      orders/new/page.tsx        # Create new order
      menu/page.tsx              # Menu management (+ dynamic category chips)
      kitchen/page.tsx           # Kitchen Kanban board (real-time via SignalR)
      overview/page.tsx          # Analytics & charts
      reports/page.tsx           # Weekly revenue/order comparison
      staff/page.tsx             # Staff management
      staff/schedule/page.tsx    # Weekly shift builder + request approvals
      settings/page.tsx          # Restaurant settings
    r/[restaurantId]/page.tsx    # Public AI menu-recommendation page (no auth)
    subscribe/page.tsx           # Subscription plan selection → Stripe checkout
    subscribe/success/page.tsx   # Post-payment confirmation
  components/                    # Shared UI components
  hooks/                         # Custom React hooks (useAuth, useMenu, useOrders, useKdsSignalR, ...)
  lib/
    api/                         # Typed API clients (auth, menu, orders, staff, schedule, subscriptions,
                                 #   analytics, public AI-recommend) + client helpers
    plans.ts                     # Shared subscription plan definitions (used by marketing + subscribe page)
    queryKeys.ts                 # React Query key factory
    schemas.ts                   # Zod schemas
    experiment.ts                # PostHog feature-flag hook (A/B tests)
    analytics.ts                 # PostHog helpers (events, restaurant group identification)
  stores/                        # Zustand store (useAppStore.ts — user + UI state; tokens in httpOnly cookies)
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
- **Client state:** Zustand (`stores/useAppStore.ts`) — user + UI state; **tokens are httpOnly cookies** (not localStorage)
- **Auth:** Keycloak-backed login via `POST /auth/login`; server sets httpOnly cookies; `client.ts` uses `credentials:'include'`; refresh is automatic on 401
- **Real-time:** `@microsoft/signalr` via `hooks/useKdsSignalR.ts` drives the kitchen board (orderPlaced / orderStatusChanged / orderCancelled)
- **Analytics / experiments:** PostHog (`posthog-js`) — product analytics, per-restaurant `group()` identification (`hooks/useRestaurantIdentity.ts`), and feature-flag A/B tests (`lib/experiment.ts`, `lib/analytics.ts`)
- Pages call the **real backend**; configure it with `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:5000/api/v1`) plus `NEXT_PUBLIC_KEYCLOAK_*`

## Key Packages

| Package | Purpose |
|---------|---------|
| `next` 15 + `react` 19 | Framework (App Router) |
| `@tanstack/react-query` | Server-state fetching/caching |
| `zustand` | Client state store |
| `@microsoft/signalr` | KDS real-time updates |
| `react-hook-form` + `zod` (`@hookform/resolvers`) | Forms + validation |
| `recharts` | Charts (overview / reports pages) |
| `posthog-js` | Product analytics + feature-flag A/B testing |
| `framer-motion` | Animations |
| `tailwind-merge` + `clsx` | Class name utilities |
| `@tailwindcss/container-queries` | Container-based responsive styles |

## Testing

- Unit: Jest + React Testing Library (+ `jest-axe` for a11y) — `npm test`
- E2E: Playwright — `npm run test:e2e`
