import { expect, test } from '@playwright/test';
import { DASHBOARD, SITE, expectNoErrorOverlay, loginDashboard } from './helpers';

test('the site home page renders', async ({ page }) => {
  const response = await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expectNoErrorOverlay(page, 'site home');
});

test('an admin can log into the dashboard', async ({ page }) => {
  await loginDashboard(page);
  expect(page.url()).toContain('/admin/home');
  await expectNoErrorOverlay(page, 'dashboard home');
});

test('the dashboard rejects a wrong password', async ({ page }) => {
  await page.goto(`${DASHBOARD}/admin`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', 'admin@info.com');
  await page.fill('input[name="password"]', 'definitely-not-the-password');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('domcontentloaded');
  expect(page.url()).not.toContain('/admin/home');
});
