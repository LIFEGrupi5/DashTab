# AI Development Log

## Summary Statistics
- Total entries: 34
- Estimated total time saved: ~30h
- Most used tool: Claude / Cursor Agent
- Updated through: Milestone 2 (M2.8, M2.9, M2.4, CI pipelines) + Apr 2026 integration & UX + **Apr 16–17 git-dated sessions** (waiter UI, docs, CI, state merge)

---

## Milestone 1 — Product Foundation (Due Mar 27)

### Enes    

| # | Tool | Area | Purpose | Output Quality | Time Saved | Lessons Learned |
|---|---|---|---|---|---|---|
| 1 | Claude | PM | Project brief analysis — risks and grading traps | Good | ~1h | Give Claude the full document, it catches non-obvious requirements |
| 2 | Claude | PM | README review and rewrite | Good | ~45min | Ask what's wrong first, then ask for a rewrite |
| 3 | Claude | PM | CLAUDE.md files for monorepo | Needed 2-3 rounds | ~1.5h | Specify ports, current state, and length upfront |
| 4 | Claude | PM | AI log structure for team project | Good | ~20min | Ask about team-specific concerns early |



### [Name 2]
| # | Tool | Area | Purpose | Prompt Summary | Output Quality | Time Saved | Lessons Learned |
|---|---|---|---|---|---|---|---|




### [Name 3]
| # | Tool | Area | Purpose | Prompt Summary | Output Quality | Time Saved | Lessons Learned |
|---|---|---|---|---|---|---|---|

### Milestone 1 Reflection
What worked as a team, what didn't, what we'd do differently.

---

## Milestone 2 — Frontend MVP (Due Apr 17)


| # | Tool | Area | Purpose | Output Quality | Time Saved | Lessons Learned |
|---|---|---|---|---|---|---|

| 1 | Claude | Frontend | Milestone audit M2.4–M2.9 — checked what exists, what's missing, and what's blocked | Good | ~30min | Spawning an Explore agent against the full frontend gave a complete picture faster than manual grep |
| 2 | Claude | Frontend | M2.8 — bundle analyzer setup (`@next/bundle-analyzer`, `ANALYZE=true` script) | Good | ~20min | One config file change, immediately useful for future dep audits |
| 3 | Claude | Frontend | M2.8 — Web Vitals tracking component wired into root layout | Good | ~30min | Using dynamic `import('web-vitals')` in a `useEffect` avoids adding to the critical JS path |
| 4 | Claude | Frontend | M2.8 — code splitting: extracted `KitchenBoard` into dynamically-imported client component with loading skeleton | Needed one fix round | ~45min | Next.js 15 blocks `ssr: false` inside Server Components — requires a thin `'use client'` wrapper; this is the correct enterprise pattern |
| 5 | Claude | Frontend | M2.4 — Zod schema for staff form (`lib/schemas.ts`) with enum validation for roles and required field rules | Good | ~15min | Keep schemas simple and flat — one schema per form avoids type complexity with React Hook Form |
| 6 | Claude | Frontend | M2.4 — `FileUpload.tsx` with click-to-browse, image-only filter, 5MB limit | Good | ~20min | Keep file state in the parent via `useState` so it can be included in form submission |
| 7 | Claude | Frontend | M2.4 — `MultiStepForm.tsx` 3-step wizard with per-step validation via `trigger()` | Needed 2 fix rounds | ~1h | Don't wrap multi-step forms in a `<form>` tag — it causes accidental submission on intermediate steps; use a `<div>` and call `trigger()` + `getValues()` manually |
| 8 | Claude | Frontend | M2.4 — bug fix: role validation failing despite dropdown showing a value | Good | ~10min | Always set `defaultValues` for every field including dropdowns — without it React Hook Form sees `undefined` and Zod enum check fails |
| 9 | Claude | DevOps | CI pipeline architecture advice — asked Claude where workflows should live in a monorepo and how to split them per service | Good | ~45min | GitHub Actions workflows must live in `.github/workflows/` regardless of monorepo structure; `devops/ci/` is for scripts, not workflow YAMLs |
| 10 | Claude | DevOps | Frontend CI jobs — asked Claude to review and extend the pipeline with unit test, e2e, and Lighthouse jobs | Good | ~30min | Separate jobs run in parallel so a lint failure doesn't hide test failures |
| 11 | Claude | Frontend | M2.6 — asked Claude to explain and set up Jest + RTL and Playwright, then fixed errors that came up during configuration | Needed fixes | ~1h | `setupFilesAfterEnv` not `setupFilesAfterFramework`; co-locating tests in `src/frontend/tests/` avoids tsconfig path issues that arise when tests live outside the project root |
| 12 | Claude | DevOps | M2.8 — asked Claude to explain Lighthouse and wire up `@lhci/cli` into CI with thresholds | Good | ~20min | Set accessibility threshold to `error` immediately; performance can be `warn` until baseline is established |

### Past sessions (Apr 2026) — integration, theming, and data

Follow-up work after the M2 baseline: re-wired the client stack (TanStack Query + Zustand + mock API), aligned auth and pages, completed dark mode on remaining surfaces, fixed mobile sidebar behavior, and adjusted mock menu pricing. Entries below continue the Milestone 2 table.

| # | Tool | Area | Purpose | Output Quality | Time Saved | Lessons Learned |
|---|---|---|---|---|---|---|
| 13 | Cursor Agent | Frontend | Restored data layer: `@tanstack/react-query` + DevTools, Zustand store with `persist`/`devtools`, `lib/queryKeys.ts`, `lib/api/mock.ts`, hooks (`useOrders`, `useMenu`, `useUsers`, `useAuth`, `useStoreHydrated`), `AppProviders` (`QueryClientProvider`, dark-class sync, auth query warmup) wired in root layout | Good | ~2h | Keep query keys centralized; `suppressHydrationWarning` on `<html>` avoids theme flash; validate `package.json` after merges so `zod` and `zustand` both stay listed |
| 14 | Cursor Agent | Frontend | Auth flow: login calls `setAuth` + `mockTokenForUserId`, `queryClient.invalidateQueries({ queryKey: ['auth'] })`; `clearAuth` on sign-out; role/nav driven from store instead of only `localStorage` | Good | ~25min | Legacy `localStorage` keys can stay cleared in `clearAuth` until all readers are migrated |
| 15 | Cursor Agent | Frontend | Theming: softer `.dark` CSS variables (`globals.css`); `Button`, `PageHeader`, `TextField`, `Modal`, `StatCard` use `dark:` + `bg-card` / `border-border` patterns | Good | ~45min | Prefer design tokens over ad-hoc grays so charts and modals stay consistent |
| 16 | Cursor Agent | Frontend | Dashboard shell: role-based nav (waiter vs owner), sidebar expand/collapse + dark mode toggle, hydration gate for layout; pages (orders, dashboard, menu, staff, `orders/new`) wired to hooks and mock data | Good | ~1.5h | `useStoreHydrated` prevents wrong nav or redirects before Zustand rehydrates; single mock source reduces drift between list and detail views |
| 17 | Cursor Agent | Frontend | Dark mode sweep: `KitchenBoard` + `DynamicKitchenBoard` loading skeleton, Overview “Orders by Hour” / “Top Ordered Items”, `MultiStepForm`, signup page, `FileUpload` | Good | ~45min | Inner chart/track areas often need their own `dark:bg-*` strip, not only the outer card |
| 18 | Cursor Agent | Frontend | Kitchen kanban: semantic `dark:` on columns and order cards; added primary action on Ready column (“Mark Ready”) to match other columns | OK | ~10min | Label may later change to “Complete” / “Served” once the real workflow is fixed |
| 19 | Cursor Agent | Frontend | Mobile sidebar: fixed `w-14` icon rail below `sm`; `sm+` uses stored open/closed width; tightened padding, `shrink-0`, `overflow-x-hidden` on shell; hide panel toggle on xs where width does not change | Good | ~35min | Nav labels stay `hidden sm:inline` — pairing with a narrow fixed rail avoids a wide empty sidebar on phones |
| 20 | Cursor Agent | Frontend | Mock data: Byrek menu price set to **€1.20**; order #003 line amounts and `totalAmount` recalculated; Overview top-items Byrek revenue updated (6 × €1.20) | Good | ~10min | After any price change, grep the dish name and update order line totals, not only `MOCK_MENU` |

### Session — Apr 16, 2026 (yesterday vs. Apr 17 push; from `git log`)

Work landed the **day before** the large Apr 17 merge day: waiter-focused UI, repo docs, and project/backend foundation. These sessions complement the “Apr 2026 integration” block above (some ideas were iterated again when TanStack/Zustand landed).

| # | Tool | Area | Purpose | Output Quality | Time Saved | Lessons Learned |
|---|---|---|---|---|---|---|
| 21 | Cursor / team | Frontend | **Waiter experience (PR #5 / `design-waiter`):** waiter-only dashboard & orders flows, role-based navigation (fewer routes for waiter), layout tuned for floor staff | Good | ~1.5h | Role from `localStorage` was fine for demos; migrating to Zustand + query cache (later entries) removed split-brain reads |
| 22 | Cursor / team | Docs | **`ai-logs.md` + CLAUDE.md:** team added root / backend / frontend / devops CLAUDE files and the shared AI development log for coursework handoff | Good | ~45min | Same themes as M1 rows 3–4, but as committed repo artifacts — worth one pointer in the log so graders see the timeline |
| 23 | Cursor / team | DevOps / monorepo | **Project setup + backend API merge:** structure and backend scaffold brought into `main` so frontend features had a stable base | Good | ~1h | Backend path clarified early; frontend CI and app work could proceed in parallel branches |
| 24 | Cursor / team | Frontend | **Design polish on waiter path:** typography, order filters / tabs, spacing — aligned with “operations” feel before dark-mode and sidebar refactors | Good | ~45min | Filter/toolbars that wrap cleanly on small widths paid off when the mobile sidebar rail shipped later |

### Session — Apr 17, 2026 (next day: tests, CI, state, dark mode — from `git log`)

Heavy integration day (merges, CI fixes, M2.5 state branch, dark-mode/responsive sidebar). Logged here so “yesterday” (Apr 16) vs. “integration day” (Apr 17) stay distinguishable in the submission.

| # | Tool | Area | Purpose | Output Quality | Time Saved | Lessons Learned |
|---|---|---|---|---|---|---|
| 25 | Cursor / team | Frontend | **M2.6 + M2.8:** Jest/RTL, Playwright e2e, Lighthouse CI, GitHub Actions — first full pipeline | Needed fixes | ~2h | `setupFilesAfterEnv` naming; Lighthouse thresholds relaxed then tightened in follow-up commits |
| 26 | Cursor / team | Frontend | **M2.4 forms:** staff Zod schema, `MultiStepForm`, `FileUpload` — wizard validation with `trigger()` / `getValues()` | Good | ~1.5h | Matches M2 table rows 5–8; session work was finishing PR and fixing submission edge cases |
| 27 | Cursor / team | DevOps | **CI hardening:** ESLint CLI migration, Lighthouse CI assertion tweaks, Jest-axe pass, pipeline fixes (`fixing ci pipeline`, lint-lighthouse PRs) | Needed fixes | ~1.5h | Parallel jobs help, but flaky e2e/Lighthouse need retries or `continue-on-error` only where documented |
| 28 | Cursor / team | Frontend | **`dark-mode-fix` / responsive sidebar:** `fix(frontend): dark-mode classes across pages and responsive sidebar` + merge with `development` / `m2.5-state-setup` | Good | ~1.5h | Overlaps entries 15–19 — Apr 17 commit is the branch that landed in repo; keep one line here for git traceability |
| 29 | Cursor / team | Tooling | **`npm installed` / dependency sync** after merges — lockfile aligned for CI reproducibility | Good | ~15min | After big merges, run `npm ci` locally and in CI to catch lockfile drift early |
| 30 | Cursor / team | Frontend | **M2.5 state setup (WIP → merge):** TanStack Query + Zustand direction merged with `development` (precursor to entries 13–16) | Good | ~2h | Feature branch needed explicit merge resolution; `Merged with main` commits mark integration checkpoints |

### Session — M2.7 accessibility + M2.8 Lighthouse run

| # | Tool | Area | Purpose | Output Quality | Time Saved | Lessons Learned |
|---|---|---|---|---|---|---|
| 31 | Claude | Frontend | M2.8 — ran `npm run build && npx lhci autorun`, generated Lighthouse reports for `/login` and `/dashboard`, saved results in `.lighthouseci/` | Good | ~20min | Build must succeed before `lhci autorun` — `npm run start` needs a compiled app; run `npm install` after pulling to avoid missing package errors |
| 32 | Claude | Frontend | M2.7 — identified 2 real violations from Lighthouse output: `color-contrast` on login badge (`text-orange-600 bg-orange-50`, ratio ~2.3:1) and `link-name` on dashboard nav (icon-only links have no text for screen readers) | Good | ~15min | Read the Lighthouse output first before writing any code — it tells you exactly what to fix |
| 33 | Claude | Frontend | M2.7 — fixed `color-contrast`: login badge changed from `text-orange-600 bg-orange-50` → `text-orange-800 bg-orange-100` (ratio ~4.8:1, passes WCAG AA) | Good | ~5min | WCAG AA requires 4.5:1 for small text — orange-800/100 is the correct Tailwind pairing |
| 34 | Claude | Frontend | M2.7 — fixed `link-name`: added `aria-label={item.label}` to every nav link in `layout.tsx` so screen readers can read icon-only links on mobile | Good | ~5min | Always pair icon-only interactive elements with `aria-label` — it is invisible on screen but read aloud by screen readers |
| 35 | Claude | Frontend | M2.7 — wrote `accessibility.test.tsx` using `jest-axe` to automatically catch violations on `Button` and `Modal` in every test run | Good | ~15min | `expect.extend(toHaveNoViolations)` must be called at the top of the file, not inside a `beforeAll` |
| 36 | Claude | Frontend | M2.7 — fixed CI failure: `jest-axe` was installed locally but not saved to `package.json`; CI runs `npm install` from `package.json` so it could never find the package | Good | ~10min | Always use `npm install -D` — the `-D` flag writes the package to `devDependencies` in `package.json`; without it only your machine has it |

---
