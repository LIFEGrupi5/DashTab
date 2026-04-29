import { test, expect } from '@playwright/test';

test.describe('Dashboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('navigates to orders page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Orders' }).first().click();
    await expect(page).toHaveURL('/orders');
  });

  test('navigates to overview page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Overview' }).first().click();
    await expect(page).toHaveURL('/overview');
  });

  test('navigates to menu page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Menu' }).first().click();
    await expect(page).toHaveURL('/menu');
  });

  test('dark mode toggle applies dark class to html', async ({ page }) => {
    await page.getByRole('button', { name: 'Dark mode' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('logout returns to login page', async ({ page }) => {
    await page.getByRole('link', { name: /log out|sign out/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
