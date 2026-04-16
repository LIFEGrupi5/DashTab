# AI Development Log

## Summary Statistics
- Total entries: 10
- Estimated total time saved: ~8h
- Most used tool: Claude
- Updated through: Milestone 2 (M2.8, M2.9)

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