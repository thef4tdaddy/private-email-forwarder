import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('should load settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveTitle(/SentinelShare/);
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('should display Run Now button', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: 'Run Now' })).toBeVisible();
  });
});
