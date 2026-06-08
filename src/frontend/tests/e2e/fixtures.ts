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
