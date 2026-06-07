import { test as base, expect } from '@playwright/test';

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMTExMTExMTEtMTExMS0xMTExLTExMTEtMTExMTExMTExMTExIiwgImVtYWlsIjogIm93bmVyQGRhc2h0YWIuZGV2IiwgIm5hbWUiOiAiRGVtbyBPd25lciIsICJwcmVmZXJyZWRfdXNlcm5hbWUiOiAib3duZXIiLCAicmVhbG1fYWNjZXNzIjogeyJyb2xlcyI6IFsiT3duZXIiXX0sICJleHAiOiA5OTk5OTk5OTk5fQ.fake_signature_for_tests';

const MOCK_SESSION = {
  accessToken: MOCK_ACCESS_TOKEN,
  refreshToken: 'mock_refresh_token',
  expiresIn: 300,
};

export const test = base.extend({
  page: async ({ page }, apply) => {
    await page.route('**/api/v1/auth/login', route =>
      route.fulfill({ status: 200, json: MOCK_SESSION })
    );
    await page.route('**/api/v1/auth/refresh', route =>
      route.fulfill({ status: 200, json: MOCK_SESSION })
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
