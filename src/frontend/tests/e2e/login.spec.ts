import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('signs in with default demo account and redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('can select a different demo account before signing in', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('manager@restaurant.com').click();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
  });
});
