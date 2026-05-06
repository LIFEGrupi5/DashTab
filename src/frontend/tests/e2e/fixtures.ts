import { test as base, expect } from '@playwright/test';

const MOCK_USER = {
  id: '33333333-3333-3333-3333-333333333333',
  name: 'Ana Kovaci',
  email: 'ana@restaurant.com',
  role: 'waiter',
  active: true,
};

const MOCK_SESSION = {
  token: 'mock_token_33333333-3333-3333-3333-333333333333',
  user: MOCK_USER,
};

export const test = base.extend({
  page: async ({ page }, use) => {
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
    await use(page);
  },
});

export { expect };
