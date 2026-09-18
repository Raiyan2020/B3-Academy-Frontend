import { expect, type Page } from '@playwright/test';

export const SITE = 'http://localhost:3000';
export const DASHBOARD = 'http://127.0.0.1:8000';

/** Seeded credentials (backend/database/seeders/AdminSeeder.php, UserSeeder.php). */
export const ADMIN = { email: 'admin@info.com', password: '123456789' };
export const USER = { email: 'ahmed@example.com', password: '123456789' };

/**
 * Text that means the page blew up. A Next dev server answers 200 for a route
 * that threw and rendered an error overlay, so status alone proves nothing.
 */
const CLIENT_ERROR_MARKERS = [
  'Application error',
  'Unhandled Runtime Error',
  'This page could not be found',
  'Internal Server Error',
  'Whoops, looks like something went wrong',
  'SQLSTATE',
  'Undefined variable',
  'Call to undefined',
  'view [',
];

/**
 * Assert a page rendered without an error surface.
 *
 * Checks the visible body text rather than the raw HTML: Next.js ships error
 * strings inside its dev client bundle on every page, so matching raw HTML
 * would flag every route as broken.
 */
export async function expectNoErrorOverlay(page: Page, label: string) {
  const body = (await page.locator('body').innerText().catch(() => '')) || '';
  const hit = CLIENT_ERROR_MARKERS.find((marker) => body.includes(marker));
  expect(hit, `${label}: page shows "${hit}"`).toBeUndefined();
}

/** Console errors and failed requests collected for the lifetime of a page. */
export function watchForErrors(page: Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  return { consoleErrors, failedRequests };
}

/**
 * Ensure the page has an authenticated dashboard session.
 *
 * Idempotent: the `dashboard` project loads a stored session, in which case
 * `/admin` redirects straight to `/admin/home` and there is no login form to
 * fill. Only submit credentials when the form is actually present.
 */
export async function loginDashboard(page: Page) {
  await page.goto(`${DASHBOARD}/admin`, { waitUntil: 'domcontentloaded' });

  if (page.url().includes('/admin/home')) return;

  const emailField = page.locator('input[name="email"]');
  if ((await emailField.count()) === 0) return;

  await emailField.fill(ADMIN.email);
  await page.fill('input[name="password"]', ADMIN.password);
  await Promise.all([
    page.waitForURL(/\/admin\/home/, { timeout: 120_000 }),
    page.click('button[type="submit"]'),
  ]);
}
