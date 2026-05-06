import { test as base, expect } from '@playwright/test';

const MOCK_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Admin User',
  email: 'admin@restaurant.com',
  role: 'owner',
  active: true,
};

const MOCK_SESSION = {
  token: 'mock_token_11111111-1111-1111-1111-111111111111',
  user: MOCK_USER,
};

export const test = base.extend({
  page: async ({ page }, apply) => {
    await page.route('**/api/v1/auth/login', route =>
      route.fulfill({ status: 200, json: MOCK_SESSION })
    );
    await page.route('**/api/v1/auth/me', route =>
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
    await apply(page);
  },
});

export { expect };
