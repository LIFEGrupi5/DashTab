import { chromium } from '@playwright/test';

// Pre-warm the Next.js dev server's webpack cache for every route the tests
// visit. Without this, parallel workers all trigger lazy compilation at the
// same time: the first request to a route takes 10-30 s in dev mode, which
// exceeds the assertion timeout and also activates the build-activity overlay
// (a <nextjs-portal> that intercepts pointer events while compiling).
//
// Note: dev-server specific. If tests ever run against a pre-built server
// (staging URL, no webServer block), the login mock won't intercept real auth
// and waitForURL / goto calls will fail — .catch() swallows those gracefully.

const BASE = 'http://localhost:3000';

const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'owner@dashtab.dev',
  name: 'Demo Owner',
  role: 'owner',
};

export default async function globalSetup(): Promise<void> {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // --- Mock all API routes the dashboard and sub-pages call ---
  await page.route('**/api/v1/auth/login', route =>
    route.fulfill({ status: 200, json: MOCK_USER }),
  );
  for (const pattern of [
    '**/api/v1/auth/refresh',
    '**/api/v1/orders**',
    '**/api/v1/menu-items**',
    '**/api/v1/menu-categories**',
    '**/api/v1/users**',
    '**/api/v1/analytics/forecast**',
  ]) {
    await page.route(pattern, route => route.fulfill({ status: 200, json: [] }));
  }

  // --- Step 1: compile /login and land on /dashboard ---
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  const btn = page.getByRole('button', { name: /sign in/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 60_000 }).catch(() => {});
  }

  // --- Step 2: compile every route the navigation tests click ---
  const routes = ['/orders', '/overview', '/menu'];
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(
      () => {},
    );
  }

  await browser.close();
}
