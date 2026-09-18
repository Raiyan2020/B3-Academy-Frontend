import { expect, test, type Page } from '@playwright/test';
import { SITE, USER, expectNoErrorOverlay, watchForErrors } from './helpers';

/**
 * Logged-in account experience for the seeded user ahmed@example.com (backend user id 1,
 * verified against C:\Users\abdallah\Desktop\ahmed\b3-acadmy\backend\laravel via read-only
 * SELECT). That user owns: 2 course enrollments, 2 book orders, 8 favorites, an active
 * wallet + 3 transactions, 2 addresses, 7 care bookings, 1 active subscription, 6
 * notifications, 5 payment transactions.
 *
 * Login goes through the real UI (`/auth` -> POST /api/user/login via loginWithBackend),
 * storing the Sanctum token under localStorage key `b3_api_token`. No token is injected.
 */

const KNOWN_404 = '/images/logo.png';

function isSameOriginFailure(url: string) {
  return (url.includes('localhost:3000') || url.includes('127.0.0.1:8000')) && !url.includes(KNOWN_404);
}

// The Next dev server serves static HTML before the client bundle hydrates, so a fill()
// issued right after 'domcontentloaded' can land before React attaches its onChange handler
// and then be wiped when hydration re-renders the (until-then uncontrolled) input back to its
// empty controlled value. Retrying fill+verify until the value sticks rides out that window
// without an arbitrary sleep.
async function fillStable(page: Page, selector: string, value: string) {
  const locator = page.locator(selector);
  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }).toPass({ timeout: 15_000 });
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.goto(`${SITE}/auth`, { waitUntil: 'domcontentloaded' });
  // Both fields must hold together, not each at its own fill time — a hydration
  // re-render landing between the two wipes the first one back to empty.
  await expect(async () => {
    await fillStable(page, '#auth-email', email);
    await fillStable(page, '#auth-password', password);
    await expect(page.locator('#auth-email')).toHaveValue(email);
  }).toPass({ timeout: 30_000 });
}

/**
 * Ensure the page has a signed-in session.
 *
 * Idempotent on purpose. `/api/v1/user/login` is throttled to 5 attempts per
 * minute and this file has well over 30 tests, so logging in from scratch in
 * every `beforeEach` throttled the suite against itself — the resulting
 * failures looked like application bugs but were self-inflicted. The
 * `site-account` project loads a stored session (see `site-auth.setup.ts`), in
 * which case `/dashboard` is already reachable and no credentials are sent.
 */
async function loginAsUser(page: Page) {
  await page.goto(`${SITE}/dashboard`, { waitUntil: 'domcontentloaded' });
  if (page.url().includes('/dashboard')) return;

  await fillLoginForm(page, USER.email, USER.password);
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 60_000 }),
    page.click('button[type="submit"]'),
  ]);
}

test.describe('login', () => {
  // These two exercise the login form itself, so they must start signed out —
  // the stored session the rest of the file replays would skip the very thing
  // under test.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('logs in through the real UI and lands on the dashboard', async ({ page }) => {
    const errors = watchForErrors(page);
    await fillLoginForm(page, USER.email, USER.password);
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 60_000 }),
      page.click('button[type="submit"]'),
    ]);
    expect(page.url()).toContain('/dashboard');
    await expectNoErrorOverlay(page, 'post-login dashboard');
    await expect(page.getByText(USER.email)).toBeVisible();

    const bad = errors.failedRequests.filter(isSameOriginFailure);
    expect(bad, `unexpected same-origin failures: ${bad.join(', ')}`).toEqual([]);
  });

  test('rejects a wrong password with a visible error', async ({ page }) => {
    await fillLoginForm(page, USER.email, 'definitely-wrong-password');
    await page.click('button[type="submit"]');
    await expect(page.getByText('البريد الإلكتروني أو كلمة المرور غير صحيحة.')).toBeVisible();
    expect(page.url()).not.toContain('/dashboard');
  });
});

// Sections enumerated from AccountShell's nav (src/features/account/components/account-shell.tsx).
const ACCOUNT_SECTIONS: Array<{ path: string; label: string }> = [
  { path: '/dashboard', label: 'dashboard home' },
  { path: '/dashboard/profile', label: 'profile' },
  { path: '/dashboard/password', label: 'password' },
  { path: '/dashboard/courses', label: 'my courses' },
  { path: '/dashboard/books', label: 'my books' },
  { path: '/dashboard/clinic-bookings', label: 'clinic bookings' },
  { path: '/dashboard/consultations', label: 'consultations' },
  { path: '/dashboard/trips', label: 'trips' },
  { path: '/dashboard/subscription', label: 'subscription' },
  { path: '/dashboard/payments', label: 'payments' },
  { path: '/dashboard/health-assessments', label: 'health assessments' },
  { path: '/dashboard/favorites', label: 'favorites' },
  { path: '/dashboard/notifications', label: 'notifications' },
  { path: '/dashboard/newsletter', label: 'newsletter' },
  { path: '/dashboard/security', label: 'security' },
];

// Each of these sections has seeded rows for user id 1 (checked directly against the sqlite
// DB). Its component only ever shows either its empty-state heading or `<article>` rows for
// data, so proving an `article` renders proves the seeded data actually reached the page.
const SEEDED_SECTIONS = new Set([
  '/dashboard/courses',
  '/dashboard/books',
  '/dashboard/clinic-bookings',
  '/dashboard/consultations',
  '/dashboard/trips',
  '/dashboard/favorites',
  '/dashboard/notifications',
  '/dashboard/health-assessments',
]);

test.describe('account sections', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  for (const section of ACCOUNT_SECTIONS) {
    test(`renders with no error surface: ${section.label}`, async ({ page }) => {
      const errors = watchForErrors(page);
      await page.goto(`${SITE}${section.path}`, { waitUntil: 'domcontentloaded' });
      await expectNoErrorOverlay(page, section.label);

      if (SEEDED_SECTIONS.has(section.path)) {
        await expect(
          page.locator('article').first(),
          `${section.label}: expected seeded data (an <article> row) but none rendered`,
        ).toBeVisible({ timeout: 15_000 });
      }

      const pageErrors = errors.consoleErrors.filter((message) => message.startsWith('pageerror:'));
      expect(pageErrors, `${section.label}: uncaught page errors`).toEqual([]);

      const bad = errors.failedRequests.filter(isSameOriginFailure);
      expect(bad, `${section.label}: same-origin requests >= 400: ${bad.join(', ')}`).toEqual([]);
    });
  }

  test('subscription section shows the active seeded plan', async ({ page }) => {
    await page.goto(`${SITE}/dashboard/subscription`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('الخطة الحالية')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('لا يوجد اشتراك فعال')).toHaveCount(0);
  });

  test('payments section lists the seeded payment history', async ({ page }) => {
    await page.goto(`${SITE}/dashboard/payments`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('لا توجد عمليات دفع')).toHaveCount(0, { timeout: 15_000 });
  });
});

test.describe('course player', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('opens an enrolled course and renders its curriculum', async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto(`${SITE}/dashboard/courses`, { waitUntil: 'domcontentloaded' });
    const continueLink = page.locator('a[href^="/learn/"]').first();
    await expect(continueLink, 'expected at least one enrolled course with a "continue" link').toBeVisible({ timeout: 15_000 });
    await continueLink.click();
    await page.waitForURL(/\/learn\//, { timeout: 15_000 });
    await expectNoErrorOverlay(page, 'course player');

    // Curriculum sidebar: at least one section header (course-player.tsx renders each
    // course_sections row as this exact classed div) and one lesson row button must render.
    const sectionHeaders = page.locator('aside div.bg-slate-50');
    await expect(sectionHeaders.first(), 'expected a course section header to render').toBeVisible({ timeout: 15_000 });
    expect(await sectionHeaders.count()).toBeGreaterThan(0);

    const lessonButtons = page.locator('aside button').filter({ has: page.locator('svg') });
    await expect(lessonButtons.first(), 'expected a lesson row to render').toBeVisible({ timeout: 15_000 });
    expect(await lessonButtons.count()).toBeGreaterThan(0);

    const pageErrors = errors.consoleErrors.filter((message) => message.startsWith('pageerror:'));
    expect(pageErrors, 'course player: uncaught page errors').toEqual([]);
    const bad = errors.failedRequests.filter(isSameOriginFailure);
    expect(bad, `course player: same-origin requests >= 400: ${bad.join(', ')}`).toEqual([]);
  });
});

test.describe('favorites toggle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('favoriting then un-favoriting a course reflects both states in the UI (self-reversing)', async ({ page }) => {
    await page.goto(`${SITE}/courses`, { waitUntil: 'domcontentloaded' });
    const courseLink = page.locator('a[href^="/courses/"]').first();
    await expect(courseLink).toBeVisible({ timeout: 15_000 });
    await courseLink.click();
    await page.waitForLoadState('domcontentloaded');

    const favoriteButton = page.getByRole('button', { name: /favorite|مفضلة/i });
    await expect(favoriteButton).toBeVisible({ timeout: 15_000 });

    const wasFavorited = (await favoriteButton.getAttribute('aria-pressed')) === 'true';

    // Toggle once.
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', String(!wasFavorited), { timeout: 10_000 });

    // Toggle back to the original state (self-reversing, per instructions).
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', String(wasFavorited), { timeout: 10_000 });
  });
});

test.describe('logout', () => {
  test('clears the session so a protected page is no longer reachable', async ({ page }) => {
    await loginAsUser(page);
    await page.goto(`${SITE}/dashboard/security`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
    await page.waitForURL(SITE + '/', { timeout: 15_000 });

    // A protected page (wrapped in <RequireAuth>) must now refuse to render its content.
    await page.goto(`${SITE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Authentication is required to view this page.')).toBeVisible({ timeout: 15_000 });
  });
});
