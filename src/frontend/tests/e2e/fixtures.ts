import { test as base, expect } from '@playwright/test';

// After the httpOnly cookie migration, POST /auth/login returns AuthUser directly.
// Tokens are set as httpOnly cookies by the server — never returned to JS.
const MOCK_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'owner@dashtab.dev',
  name: 'Demo Owner',
  role: 'owner',
};

export const test = base.extend({
  page: async ({ page }, apply) => {
    // In dev mode Next renders a <nextjs-portal> dev-overlay anchored bottom-left,
    // which sits over the sidebar "Log out" link and intercepts the click. Make
    // the portal click-through on every page so it can never swallow a click.
    // (Test-only; the overlay still renders, it just stops capturing pointers.)
    await page.addInitScript(() => {
      const inject = () => {
        const style = document.createElement('style');
        style.textContent = 'nextjs-portal{pointer-events:none!important}';
        (document.head ?? document.documentElement).appendChild(style);
      };
      if (document.head) inject();
      else document.addEventListener('DOMContentLoaded', inject);
    });

    await page.route('**/api/v1/auth/login', route =>
      route.fulfill({ status: 200, json: MOCK_USER })
    );
    await page.route('**/api/v1/auth/refresh', route =>
      route.fulfill({ status: 200, json: MOCK_USER })
    );
    await page.route('**/api/v1/orders**', route =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route('**/api/v1/menu-items**', route =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route('**/api/v1/menu-categories**', route =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route('**/api/v1/users**', route =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route('**/api/v1/analytics/forecast**', route =>
      route.fulfill({ status: 200, json: { forecast: [], message: null } })
    );
    await apply(page);
  },
});

export { expect };
