import { test, expect } from './fixtures';

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

  test('dark mode toggle switches the dark class on html', async ({ page }) => {
    const html = page.locator('html');
    // Dark mode is the default, so the app starts dark.
    await expect(html).toHaveClass(/dark/);
    // Toggling to light removes the class…
    await page.getByRole('button', { name: 'Light mode' }).click();
    await expect(html).not.toHaveClass(/dark/);
    // …and toggling back re-applies it.
    await page.getByRole('button', { name: 'Dark mode' }).click();
    await expect(html).toHaveClass(/dark/);
  });


  test('logout returns to login page', async ({ page }) => {
    const logoutLink = page.getByRole('link', { name: /log out|sign out/i });
    await logoutLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/login');
  });
});
