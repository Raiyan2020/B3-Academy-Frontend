import { expect, test } from '@playwright/test';
import { DASHBOARD, loginDashboard } from './helpers';

/**
 * Independent re-verification of the dashboard routes reported as broken.
 * Each expects a 200 — so a passing test means the bug is FIXED, and a failing
 * test is the bug reproducing.
 *
 * `/admin/books/{id}/buyers` is deliberately absent: BookController::buyers()
 * calls abort(404) for non-AJAX requests, so its 404 is the designed
 * behaviour, not a defect.
 */
const REPORTED_BROKEN = [
  ['activity logs', '/admin/activity-logs'],
  ['ai assistant keyword show', '/admin/ai-assistant-keywords/1'],
  ['clinic show', '/admin/clinics/1'],
  ['general clinic services', '/admin/general-clinic-services'],
  ['notification item-unavailable', '/admin/core-notifications/item-unavailable'],
  ['role show', '/admin/roles/1'],
] as const;

test('reported-broken dashboard routes', async ({ page }) => {
  await loginDashboard(page);

  const results: string[] = [];
  for (const [label, path] of REPORTED_BROKEN) {
    const response = await page.goto(`${DASHBOARD}${path}`, { waitUntil: 'domcontentloaded' });
    const status = response?.status() ?? 0;
    const body = await page.locator('body').innerText().catch(() => '');
    const marker = ['Whoops', 'Exception', 'syntax error', 'lazy load', 'Unable to locate']
      .find((m) => body.includes(m));
    results.push(`${String(status).padEnd(4)} ${label.padEnd(32)} ${path}${marker ? `  [${marker}]` : ''}`);
  }

  console.log('\n' + results.join('\n') + '\n');
  expect(results.filter((r) => !r.startsWith('200')), results.join('\n')).toHaveLength(0);
});

/**
 * The page returned 200 but rendered an empty grid: DataTables asked the server
 * to ORDER BY `subscriptions.user`, a relation rather than a column, so the
 * query threw and recordsFiltered came back 0 while recordsTotal reported the
 * real count. Only a browser run catches this — the HTML alone looks fine.
 */
test('client-subscriptions grid returns the rows it counts', async ({ page }) => {
  await loginDashboard(page);

  const payload = page.waitForResponse(
    (r) => r.url().includes('/admin/client-subscriptions') && r.request().method() === 'GET' && r.url().includes('draw='),
  );
  await page.goto(`${DASHBOARD}/admin/client-subscriptions`, { waitUntil: 'domcontentloaded' });

  const json = await (await payload).json();
  console.log(`recordsTotal=${json.recordsTotal} recordsFiltered=${json.recordsFiltered} error=${json.error ?? 'none'}`);

  expect(json.error, 'server-side DataTables error').toBeFalsy();
  expect(json.recordsTotal).toBeGreaterThan(0);
  expect(json.recordsFiltered).toBe(json.recordsTotal);
  expect(json.data.length).toBeGreaterThan(0);
});
