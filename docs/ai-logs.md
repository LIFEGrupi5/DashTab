# AI Development Log

## Summary Statistics
- Total entries: 16
- Estimated total time saved: ~13h
- Most used tool: Claude
- Updated through: Milestone 2 (M2.8, M2.9, M2.4, CI pipelines)

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
