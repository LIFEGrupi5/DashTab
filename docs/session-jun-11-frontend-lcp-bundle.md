# Session — Jun 11, 2026: First-Load LCP Bundle Optimisation

## What We Did

Investigated a "the first page load takes 10+ seconds" complaint, proved it was **not** the database cluster, the new pagination, or the CSP header, and traced it to the **frontend JavaScript bundle**. Fixed the two heaviest critical-path dependencies (PostHog and framer-motion) and the legacy-JS bundle, cutting per-route First Load JS by **30–36%**.

Branch: `perf/frontend/lcp-bundle` (off `development`).

---

## How We Diagnosed It (measure, don't guess)

The complaint was vague ("a page takes too long, maybe the DB cluster, maybe remove CSP"). We resolved it with three measurements, each of which **eliminated** a suspect:

| Measurement | Result | Conclusion |
|---|---|---|
| DevTools → Network → `/orders` request | sent 0.26ms · **TTFB 377ms** · download 0.75ms | The API is fast — not the DB, not pagination |
| DevTools → Network → document (page HTML) | **TTFB ~45ms** | The server/SSR is fast — not a cold pod |
| Lighthouse (slow-4G / Moto-G emulation) | **FCP 0.9s but LCP 8.4s** | The time is spent *in the browser*, after the HTML arrives |

### What the metrics mean

- **FCP (First Contentful Paint)** — when the browser paints *anything* (here: the `"Loading…"` placeholder). 0.9s = good.
- **LCP (Largest Contentful Paint)** — when the *main content* (the order cards) appears. 8.4s = bad.
- The **gap between FCP and LCP** is the whole problem: the shell shows instantly, but real content stalls for ~7.5s.

> ⚠️ The 8.4s is under Lighthouse's **simulated slow phone on slow-4G**. A real desktop is faster — but the *shape* (a long FCP→LCP gap caused by JS) is real and is why first loads drag.

### Why the gap exists

Every dashboard route is a client component (`'use client'`) and the layout hard-gates on store hydration:

```tsx
// app/(dashboard)/layout.tsx
if (!hydrated || !user) return <div>Loading…</div>;
```

So the sequence on first load is **fully serial, and all in the browser**:

```
45ms   HTML arrives (just a shell)
0.9s   FCP — paints "Loading…"
  ↓    download the JS bundle  (posthog-js ~50KB + framer-motion ~40KB + app code)
  ↓    parse + execute         (Lighthouse: 2.3s main-thread, 5 long tasks)
  ↓    hydrate → zustand rehydrates → the "Loading…" gate finally opens
  ↓    only now does useOrders() fire → /orders (377ms)
8.4s   order cards render  ← this is LCP
```

The 377ms API call lands near the *end* because nothing can fetch until the JS finishes running.

---

## Key Concept: "First Load JS" and the critical path

Next.js reports, per route, the **First Load JS** — the JavaScript the browser must download + parse + execute before that page is interactive. The bigger it is, the longer the FCP→LCP gap on a slow device.

Two ways to shrink it:

1. **Code-splitting** — instead of one big bundle, split rarely-needed or non-critical code into separate chunks loaded *later* (via dynamic `import()`). The browser fetches them after the page is interactive, off the critical path.
2. **Targeting modern browsers** — stop shipping ES5 polyfills/transforms for browsers nobody uses.

A useful subtlety we confirmed: Next splits a **"shared by all"** chunk (framework/runtime, 102 kB here) from **per-route** chunks. PostHog and framer-motion were in the *per-route* chunks of the authenticated pages — so moving them to lazy chunks shrank each route without changing the 102 kB shared baseline.

---

## The Three Changes

### 1. Lazy-load PostHog (`posthog-js`, ~50KB+)

**Before:** `lib/analytics.ts` did `import posthog from 'posthog-js'` at the top, and `PostHogProvider.tsx` called `posthog.init(...)` at module scope. Because `analytics.ts` is imported by the layout, login, and several hooks, PostHog landed in the bundle of nearly every route.

**After:**
- `lib/analytics.ts` keeps only a **type** import (`import type { PostHog }`). The real library is loaded with a dynamic `import('posthog-js')` inside `initAnalytics()`.
- `PostHogProvider.tsx` calls `initAnalytics()` inside a `useEffect` on `requestIdleCallback` — i.e. **after** the page is interactive.
- A small **buffered call queue** ensures we don't lose analytics fired before the library finishes loading:

```ts
let client: PostHog | null = null;
const pending: Array<(ph: PostHog) => void> = [];

function run(fn: (ph: PostHog) => void) {
  if (client) fn(client);            // loaded → fire now
  else if (pending.length < 50) pending.push(fn);  // not yet → buffer
}
// on load: for (const fn of pending) fn(posthog); pending.length = 0;
```

This preserves the activation funnel (`restaurant_registered → … → staff_invited`) — early events queue and flush.

- Also **dropped the `posthog-js/react` `<PHProvider>` wrapper** — a grep confirmed nothing in the app uses `usePostHog()`, so the React binding was dead weight. Removed the dependency from the bundle entirely.

> **Java analogy:** think of the old code as a `static { PostHog.init(); }` block that runs at class-load time on the request path. The new code is a lazy singleton initialised on a background thread once the app is idle, with an in-memory queue so calls made during startup aren't dropped.

### 2. Code-split framer-motion (`LazyMotion` + `m`)

framer-motion ships a large animation feature set. Its **documented** code-splitting pattern keeps a tiny core in the bundle and loads the features lazily:

- New `lib/motionFeatures.ts` exports `domAnimation`. It is referenced **only** via dynamic `import()`, so webpack puts it in its own chunk (~15KB):

```ts
// lib/motionFeatures.ts
import { domAnimation } from 'framer-motion';
export default domAnimation;
```

- `app/(dashboard)/layout.tsx` wraps the tree once and loads the features lazily:

```tsx
import { LazyMotion, m } from 'framer-motion';
const loadMotionFeatures = () => import('@/lib/motionFeatures').then(m => m.default);

<LazyMotion features={loadMotionFeatures} strict>
  …<m.div>…</m.div>…
</LazyMotion>
```

- The three usage sites (`layout.tsx`, `components/Modal.tsx`, `orders/page.tsx`) changed `motion.*` → `m.*`. Animations look identical; `strict` makes the build flag any stray `motion.*` that would silently re-bloat the bundle.

> ⚠️ **Gotcha:** importing `domAnimation` *statically* anywhere defeats the whole split — it must only ever be reached through the dynamic `import()`. That's why it lives in its own one-line module.

### 3. Modern `browserslist`

There was **no `browserslist`** in `package.json`, so Next/SWC fell back to a conservative target and shipped ES5 polyfills + transforms (Lighthouse's "Legacy JavaScript", ~29KB). Added:

```json
"browserslist": ["last 2 years", "not dead", "not op_mini all"]
```

All targeted browsers support modern ES, so the legacy output is dropped. Widen this list if older clients must be supported.

---

## Results (production `next build`, before → after)

| Route | First Load JS before | after | saved |
|---|---|---|---|
| **/orders** | 251 kB | **163 kB** | −88 kB (−35%) |
| **/menu** | 243 kB | **155 kB** | −88 kB (−36%) |
| **/dashboard** | 208 kB | **145 kB** | −63 kB (−30%) |
| /orders/new | 205 kB | 142 kB | −63 kB |
| /reports | 193 kB | 130 kB | −63 kB |
| /overview | 119 kB | 119 kB | (already lean — charts were already dynamic) |
| shared by all | 102 kB | 102 kB | (unchanged — these deps were per-route) |

~60–88 KB of download + parse + execute came off the critical path of every authenticated route. That directly attacks the 2.3s of main-thread work that was delaying LCP.

**Verification:** `tsc --noEmit` clean; `next build` succeeds before and after (the numbers above are from those two builds).

---

## What This Does *Not* Fix (follow-ups)

1. **The FCP→LCP gap is reduced, not closed.** The structural fix is **server-rendering the first page of data**: since auth is now httpOnly cookies, a server component can forward the cookie, fetch `/orders` server-side, and hydrate React Query with `initialData` so the content is in the HTML (LCP collapses toward FCP). This also means rethinking the full-page `"Loading…"` hydration gate. Estimated ~1.5–2.5 dev-days for the first route (cookie-forwarding server fetch + an internal API URL for in-cluster calls + 401 handling + Playwright fixtures, which mock in the browser and won't intercept SSR fetches). Scope it to one route first.
2. **Pagination metrics-truncation bug (separate issue).** The list endpoints default to `take=50` and the frontend calls them with no `skip`/`take`, so `/reports` and `/overview` aggregate over only the 50 most-recent orders → wrong week-over-week and "all-time" numbers. The fix is to point those pages at the existing `AnalyticsController` (server-side aggregation) rather than `useOrders`.

---

## Files Changed

| File | Change |
|---|---|
| `lib/analytics.ts` | Dynamic `import('posthog-js')` + buffered call queue; type-only static import |
| `components/providers/PostHogProvider.tsx` | Init on `requestIdleCallback`; dropped `posthog-js/react` `<PHProvider>` |
| `lib/motionFeatures.ts` | **New** — `domAnimation` in a dynamic-only chunk |
| `app/(dashboard)/layout.tsx` | `LazyMotion` + `m`; lazy feature loader |
| `components/Modal.tsx` | `motion.*` → `m.*` |
| `app/(dashboard)/orders/page.tsx` | `motion.*` → `m.*` |
| `package.json` | Added modern `browserslist` |

---

## Takeaways

- **Clear the server before touching the frontend.** One TTFB number (377ms) and the Lighthouse FCP-vs-LCP gap saved us from rebuilding the DB cluster or ripping out CSP.
- **CSP is a response header (~0 cost) and is orthogonal to cookie auth** — never a performance lever.
- **Heavy deps usually sit in per-route bundles, not the shared chunk** — lazy-loading them is a high-leverage, low-risk win.
- **Deferring analytics is safe if you buffer-and-flush** — otherwise you silently drop early funnel events.
- The biggest remaining win (server-rendering initial data) is a design change, not a bundle tweak — deploy these wins first, re-run Lighthouse, then decide.
