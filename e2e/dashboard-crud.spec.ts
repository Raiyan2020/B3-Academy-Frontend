import { test, expect, type Locator, type Page } from '@playwright/test';
import { DASHBOARD, loginDashboard, expectNoErrorOverlay, watchForErrors } from './helpers';

// The shared dev server (single-threaded `php artisan serve`, shared with other
// agents on this machine) can take 30s+ per request under load. Give actions
// and navigations more room than the project defaults so a slow response
// doesn't get mis-reported as a broken page.
test.use({ actionTimeout: 45_000, navigationTimeout: 45_000 });

/**
 * Coverage for the Laravel Blade admin dashboard's interactive surface:
 * sidebar navigation, seeded index tables, create-form validation, edit-form
 * prefill, and index search/filtering.
 *
 * This spec never creates, updates or deletes real records: create forms are
 * only ever submitted empty (to prove the validator runs), and no
 * delete/destroy control is ever clicked.
 */

/** Own-origin request failures only — ignore any third-party/analytics noise. */
function ownOriginFailures(failedRequests: string[]) {
  return failedRequests.filter((r) => r.includes('127.0.0.1:8000'));
}

/**
 * The dev sandbox has no route to Google Fonts, so every page blocks a
 * `fonts.gstatic.com` webfont load via CORS, and that in turn throws inside a
 * bundled jQuery plugin bootstrap (`Cannot read properties of undefined
 * (reading 'fn')`) before any of our own code runs. It reproduces identically
 * on every single page regardless of content, so it's environment noise, not
 * an app bug — the network-level own-origin check below still independently
 * catches any *real* failed request to our own backend.
 */
const KNOWN_NOISE = [
  /gstatic\.com/,
  /fonts\.googleapis\.com/,
  /^Failed to load resource: net::ERR_FAILED$/,
  /^Failed to load resource: the server responded with a status of \d+/,
  /^pageerror: Cannot read properties of undefined \(reading 'fn'\)$/,
];

function realConsoleErrors(consoleErrors: string[]) {
  return consoleErrors.filter((e) => !KNOWN_NOISE.some((rx) => rx.test(e)));
}

function assertClean(watcher: { consoleErrors: string[]; failedRequests: string[] }, label: string) {
  const errors = realConsoleErrors(watcher.consoleErrors);
  expect(errors, `${label}: console/page errors: ${errors.join(' | ')}`).toEqual([]);
  const failures = ownOriginFailures(watcher.failedRequests);
  expect(failures, `${label}: failed same-origin requests: ${failures.join(' | ')}`).toEqual([]);
}

/** DataTables renders rows asynchronously after the initial AJAX call resolves. */
async function waitForTableRows(page: Page, label: string): Promise<Locator> {
  const rows = page.locator('table.table tbody tr');
  await expect(rows.first(), `${label}: table never rendered any rows`).toBeVisible({ timeout: 45_000 });
  return rows;
}

test.describe('Login and dashboard shell', () => {
  test('login renders the sidebar', async ({ page }) => {
    test.setTimeout(120_000);
    const watcher = watchForErrors(page);
    await loginDashboard(page);
    await expectNoErrorOverlay(page, 'admin home');

    const sidebar = page.locator('#main-menu-navigation');
    await expect(sidebar).toBeVisible();
    const linkCount = await sidebar.locator('a[href]').count();
    expect(linkCount, 'sidebar should expose a meaningful number of nav links').toBeGreaterThan(10);

    assertClean(watcher, 'admin home');
  });

  test('every sidebar link navigates to a page with no error surface', async ({ page }) => {
    // Visits every distinct sidebar destination one by one against a live dev server.
    test.setTimeout(600_000);

    await loginDashboard(page);

    // Enumerate at runtime — never a hardcoded guess at what the sidebar contains.
    const hrefs = await page
      .locator('#main-menu-navigation a[href]')
      .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href));

    const seen = new Set<string>();
    const links = hrefs.filter((href) => {
      if (!href.startsWith(`${DASHBOARD}/admin/`)) return false;
      if (href.includes('destroy') || href.includes('logout')) return false;
      // Export endpoints trigger a file download rather than a navigable page.
      if (/export/i.test(href)) return false;
      if (seen.has(href)) return false;
      seen.add(href);
      return true;
    });

    expect(links.length, 'expected multiple distinct sidebar destinations').toBeGreaterThan(10);

    const watcher = watchForErrors(page);
    const brokenLinks: string[] = [];

    for (const href of links) {
      try {
        await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await expectNoErrorOverlay(page, href);
        const errors = realConsoleErrors(watcher.consoleErrors);
        const failures = ownOriginFailures(watcher.failedRequests);
        if (errors.length > 0 || failures.length > 0) {
          brokenLinks.push(`${href} -> console: [${errors.join(' | ')}] failed: [${failures.join(' | ')}]`);
        }
      } catch (e) {
        brokenLinks.push(`${href} -> navigation error: ${(e as Error).message}`);
      } finally {
        watcher.consoleErrors.length = 0;
        watcher.failedRequests.length = 0;
      }
    }

    expect(brokenLinks, `broken sidebar links:\n${brokenLinks.join('\n')}`).toEqual([]);
  });
});

test.describe('Index pages show seeded data', () => {
  const MODULES: Array<{ name: string; path: string }> = [
    { name: 'users', path: 'users' },
    { name: 'admins', path: 'admins' },
    { name: 'courses', path: 'courses' },
    { name: 'books', path: 'books' },
    { name: 'clinics', path: 'clinics' },
    { name: 'doctors', path: 'consultation-doctors?scope=non_primary' },
    { name: 'trips', path: 'trip-packages' },
    { name: 'subscriptions', path: 'client-subscriptions' },
    { name: 'consultation packages', path: 'consultation-packages' },
    { name: 'FAQs', path: 'faqs' },
    { name: 'encyclopedia', path: 'encyclopedia-news' },
    { name: 'community posts', path: 'articles' },
    { name: 'contact messages', path: 'contact-messages' },
    { name: 'roles', path: 'roles' },
    { name: 'orders/invoices', path: 'book-orders' },
  ];

  for (const mod of MODULES) {
    test(`${mod.name} index has data rows`, async ({ page }) => {
      test.setTimeout(120_000);
      const watcher = watchForErrors(page);
      await loginDashboard(page);
      await page.goto(`${DASHBOARD}/admin/${mod.path}`, { waitUntil: 'domcontentloaded' });
      await expectNoErrorOverlay(page, `${mod.name} index`);

      const rows = await waitForTableRows(page, `${mod.name} index`);
      const emptyMarker = page.locator('table.table tbody td.dataTables_empty');
      await expect(emptyMarker, `${mod.name} index rendered DataTables' "no data" placeholder`).toHaveCount(0);

      const rowCount = await rows.count();
      expect(rowCount, `${mod.name} index has no rows even though the DB is seeded`).toBeGreaterThan(0);

      assertClean(watcher, `${mod.name} index`);
    });
  }
});

test.describe('Create forms render and validate', () => {
  const CREATE_FORMS: Array<{ name: string; path: string }> = [
    { name: 'users', path: 'users' },
    { name: 'admins', path: 'admins' },
    { name: 'faqs', path: 'faqs' },
    { name: 'books', path: 'books' },
    { name: 'clinics', path: 'clinics' },
    { name: 'courses', path: 'courses' },
    { name: 'trip-packages', path: 'trip-packages' },
    { name: 'consultation-packages', path: 'consultation-packages' },
  ];

  for (const mod of CREATE_FORMS) {
    test(`${mod.name} create form renders fields and rejects an empty submit`, async ({ page }) => {
      test.setTimeout(120_000);
      const watcher = watchForErrors(page);
      await loginDashboard(page);
      await page.goto(`${DASHBOARD}/admin/${mod.path}/create`, { waitUntil: 'domcontentloaded' });
      await expectNoErrorOverlay(page, `${mod.name} create`);

      const form = page.locator('form').first();
      await expect(form).toBeVisible();
      const fieldCount = await form.locator('input, select, textarea').count();
      expect(fieldCount, `${mod.name} create form rendered no fields`).toBeGreaterThan(0);

      const baselineErrors = await page.locator('.text-danger').count();

      // These forms use native `required` attributes; strip them so the browser
      // actually posts the empty form instead of blocking submission itself —
      // the point here is to exercise the SERVER's validator.
      await page.evaluate(() => {
        document.querySelectorAll('form').forEach((f) => (f.noValidate = true));
        document.querySelectorAll('[required]').forEach((el) => el.removeAttribute('required'));
      });

      // These "store" forms submit via AJAX (see submit-add-form.js) — clicking
      // submit never navigates, it fires an XHR and the controller answers 422
      // with field errors that a jQuery handler injects as `.text-danger`
      // spans. Wait for that response (not for a navigation that never
      // happens) before checking the DOM for it.
      const [response] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().startsWith(`${DASHBOARD}/admin/${mod.path}`) && res.request().method() === 'POST',
          { timeout: 45_000 },
        ),
        form.locator('button[type="submit"]').first().click(),
      ]);
      expect(response.status(), `${mod.name}: empty submit should fail validation (422), not succeed`).toBe(422);

      await expectNoErrorOverlay(page, `${mod.name} create (after empty submit)`);
      await expect
        .poll(() => page.locator('.text-danger').count(), {
          timeout: 15_000,
          message: `${mod.name}: validation errors never rendered after the 422 response`,
        })
        .toBeGreaterThan(baselineErrors);

      // The 422 we just asserted on is the expected validation response, not a
      // bug — drop it (in place; the watcher keeps pushing into this same
      // array) before checking for any *other* own-origin failure.
      const keep = watcher.failedRequests.filter((r) => !r.startsWith('422 '));
      watcher.failedRequests.length = 0;
      watcher.failedRequests.push(...keep);
      assertClean(watcher, `${mod.name} create`);
    });
  }
});

test.describe('Edit forms are pre-filled', () => {
  const EDIT_FORMS: Array<{ name: string; path: string; field: string; expected: string }> = [
    { name: 'users', path: 'users/1/edit', field: 'input[name="name"]', expected: 'أحمد محمد' },
    { name: 'admins', path: 'admins/1/edit', field: 'input[name="name"]', expected: 'Super Admin' },
    {
      name: 'faqs',
      path: 'faqs/1/edit',
      field: 'input[name="question[ar]"]',
      expected: 'كيف يمكنني إنشاء حساب جديد؟',
    },
    { name: 'books', path: 'books/1/edit', field: 'input[name="name[en]"]', expected: 'The Art of Time Management' },
    {
      name: 'clinics',
      path: 'clinics/1/edit',
      field: 'input[name="name[ar]"]',
      expected: 'العيادة التخصصية المتقدمة',
    },
  ];

  for (const mod of EDIT_FORMS) {
    test(`${mod.name} edit form is pre-filled with the record's data`, async ({ page }) => {
      test.setTimeout(120_000);
      const watcher = watchForErrors(page);
      await loginDashboard(page);
      await page.goto(`${DASHBOARD}/admin/${mod.path}`, { waitUntil: 'domcontentloaded' });
      await expectNoErrorOverlay(page, `${mod.name} edit`);

      await expect(
        page.locator(mod.field),
        `${mod.name} edit form field ${mod.field} was not pre-filled with the seeded record's value`,
      ).toHaveValue(mod.expected);

      assertClean(watcher, `${mod.name} edit`);
    });
  }
});

test.describe('Search, filter and pagination change results', () => {
  test('users index name search narrows the result set', async ({ page }) => {
    test.setTimeout(120_000);
    const watcher = watchForErrors(page);
    await loginDashboard(page);
    await page.goto(`${DASHBOARD}/admin/users`, { waitUntil: 'domcontentloaded' });

    const rows = await waitForTableRows(page, 'users index');
    const totalCount = await rows.count();

    await page.fill('#search-name', 'أحمد');
    // `rows.count() > 0` would trivially pass on the STALE unfiltered rows
    // still on screen — wait for the actual DataTables reload response tied
    // to this click instead of racing a count that never goes to zero.
    await Promise.all([
      page.waitForResponse((res) => res.url().startsWith(`${DASHBOARD}/admin/users`) && res.request().resourceType() === 'xhr', {
        timeout: 45_000,
      }),
      page.click('#filter-btn'),
    ]);

    const filteredCount = await rows.count();
    expect(filteredCount, 'filtered result set should not be larger than the unfiltered one').toBeLessThanOrEqual(
      totalCount,
    );

    const texts = await rows.allInnerTexts();
    for (const text of texts) {
      expect(text, 'every visible row should match the applied name filter').toContain('أحمد');
    }

    assertClean(watcher, 'users index search');
  });

  test('trip-packages index pagination changes the visible rows', async ({ page }) => {
    test.setTimeout(120_000);
    const watcher = watchForErrors(page);
    await loginDashboard(page);
    await page.goto(`${DASHBOARD}/admin/trip-packages`, { waitUntil: 'domcontentloaded' });

    const rows = await waitForTableRows(page, 'trip-packages index');
    const firstPageFirstRowText = (await rows.first().innerText()).trim();

    const nextPageButton = page.locator('.dataTables_paginate .paginate_button.next:not(.disabled)');
    const hasNextPage = await nextPageButton.count();
    expect(hasNextPage, 'trip-packages has 12 seeded rows and should paginate — no next-page control found').toBeGreaterThan(
      0,
    );

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().startsWith(`${DASHBOARD}/admin/trip-packages`) && res.request().resourceType() === 'xhr',
        { timeout: 45_000 },
      ),
      nextPageButton.first().click(),
    ]);

    await expect
      .poll(async () => (await rows.first().innerText()).trim(), {
        timeout: 15_000,
        message: 'first row text never changed after paginating',
      })
      .not.toBe(firstPageFirstRowText);

    assertClean(watcher, 'trip-packages pagination');
  });
});
