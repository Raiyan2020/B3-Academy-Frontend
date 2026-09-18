import { expect, test } from '@playwright/test';
import { DASHBOARD, loginDashboard } from './helpers';

/**
 * The dashboard's eight export buttons, downloaded for real against the seeded
 * database.
 *
 * These cannot be covered by the page sweep (they stream a file instead of
 * rendering) and the PHP test can only prove the wiring: laravel-mpdf echoes
 * its bytes straight to output, so from PHPUnit a working PDF export looks like
 * an empty response. Here the browser receives the actual file.
 */
const EXPORTS = [
  ['users pdf', '/admin/users/export-pdf', '.pdf'],
  ['users excel', '/admin/users/export-excel', '.csv'],
  ['book orders pdf', '/admin/book-orders/export-pdf', '.pdf'],
  ['book orders excel', '/admin/book-orders/export-excel', '.csv'],
  ['client subscriptions pdf', '/admin/client-subscriptions/export-pdf', '.pdf'],
  ['consultation bookings pdf', '/admin/consultation-bookings/export-pdf', '.pdf'],
  ['consultation package purchases pdf', '/admin/consultation-package-purchases/export-pdf', '.pdf'],
  ['trip purchases pdf', '/admin/trip-purchases/export-pdf', '.pdf'],
] as const;

test('every export endpoint delivers a non-empty file', async ({ page }) => {
  test.setTimeout(5 * 60_000);
  await loginDashboard(page);

  const results: string[] = [];

  for (const [label, path, extension] of EXPORTS) {
    // An export with nothing to export redirects back with a flash instead of
    // downloading. That is correct behaviour, so treat "no download" as a
    // reportable outcome rather than a hard failure — but a download that
    // arrives must be a real, non-empty file of the right type.
    const pending = page.waitForEvent('download', { timeout: 60_000 }).catch(() => null);
    await page.goto(`${DASHBOARD}${path}`, { waitUntil: 'commit' }).catch(() => {});
    const download = await pending;

    if (!download) {
      results.push(`NO-FILE  ${label.padEnd(36)} ${path}`);
      continue;
    }

    const name = download.suggestedFilename();
    const file = await download.path();
    const size = file ? (await import('node:fs')).statSync(file).size : 0;
    results.push(`${String(size).padStart(8)}  ${label.padEnd(36)} ${name}`);

    expect(name, `${label}: wrong file extension`).toContain(extension);
    expect(size, `${label}: empty file`).toBeGreaterThan(100);
  }

  console.log('\n' + results.join('\n') + '\n');
  expect(results.filter((r) => r.startsWith('NO-FILE')), results.join('\n')).toHaveLength(0);
});
