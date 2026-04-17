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
    layout.tsx                   # Root layout (metadata, global CSS)
    page.tsx                     # Redirects to /dashboard
    (auth)/
      login/page.tsx             # Login with demo accounts
      signup/page.tsx            # Registration
    (dashboard)/
      layout.tsx                 # Sidebar navigation
      dashboard/page.tsx         # KPI overview
      orders/page.tsx            # Order management
      menu/page.tsx              # Menu management
      kitchen/page.tsx           # Kitchen Kanban board
      overview/page.tsx          # Analytics & charts
      staff/page.tsx             # Staff management
  components/                    # Shared UI components
  hooks/                         # Custom React hooks
  lib/                           # API clients, utilities
  types/                         # Shared TypeScript interfaces
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
- Variants and sizes use prop unions, not CVA — keep it consistent with existing components
- Tailwind only — no inline styles or CSS modules
- UI primitives: Radix UI (`@radix-ui/react-*`) + Lucide icons
- Toasts: `sonner`, Theming: `next-themes`

## Current State

- All pages use **mock data** — no API calls yet
- `hooks/`, `lib/`, `types/` are empty placeholders
- Authentication is UI-only (no real auth logic)

## Key Packages

| Package | Purpose |
|---------|---------|
| `next` 15 | Framework (App Router) |
| `react-hook-form` | Form state |
| `recharts` | Charts (overview page) |
| `tailwind-merge` + `clsx` | Class name utilities |
| `@tailwindcss/container-queries` | Container-based responsive styles |
