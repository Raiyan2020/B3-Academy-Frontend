import { test, expect, type Page } from '@playwright/test';
import { SITE, expectNoErrorOverlay, watchForErrors } from './helpers';

/**
 * Real ids pulled read-only from the seeded sqlite db at
 * backend/laravel (NOT backend/database/database.sqlite, which is an empty decoy).
 * See the queries run during authoring; ids below are all active/published rows.
 */
const IDS = {
  course: '1', // "Herbal Medicine Fundamentals" — status active
  book: '1', // "The Art of Time Management"
  trip: '1', // "Siwa Oasis Wellness Reset"
  clinic: '1', // "Advanced Specialized Clinic"
  doctor: '1', // "Dr. Ahmed Salem"
  blogPost: '1', // community_posts type=article, status=published
  researchPost: '6', // community_posts type=research, status=published
  theoryPost: '4', // community_posts type=theory, status=published
  monograph: '1', // plant_fungi_entries "Peppermint"
  encyclopediaNews: '1', // encyclopedia_news "Green Tea Benefits for Heart Health"
  encyclopediaHerb: '1', // herbal_library_entries "Peppermint"
};

// A term that is genuinely present in seeded data (Arabic is the base/default
// locale) — course #3 "إدارة الوقت والإنتاجية" and book #1 "فن إدارة الوقت"
// both contain it, so a working search must return at least one result.
const SEARCH_TERM = 'الوقت';

/** Any request to our own origin (localhost:3000) returning >=400, minus the known logo 404. */
function ownOriginFailures(failedRequests: string[]) {
  return failedRequests.filter((r) => r.includes('localhost:3000') && !r.includes('/images/logo.png'));
}

async function visitAndAssertClean(page: Page, path: string, label: string) {
  const { consoleErrors, failedRequests } = watchForErrors(page);
  await page.goto(`${SITE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await expectNoErrorOverlay(page, label);

  const pageErrors = consoleErrors.filter((e) => e.startsWith('pageerror:'));
  expect(pageErrors, `${label}: uncaught page error(s): ${pageErrors.join(' | ')}`).toHaveLength(0);

  // Assert, don't just log: a page whose own requests all 404 would otherwise
  // pass green while rendering nothing.
  const badOwn = ownOriginFailures(failedRequests);
  expect(badOwn, `${label}: same-origin request(s) failed: ${badOwn.join(', ')}`).toHaveLength(0);

  return { failedRequests };
}

// ---------------------------------------------------------------------------
// 1. Every public route renders cleanly.
// ---------------------------------------------------------------------------

const STATIC_ROUTES: [string, string][] = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
  ['/education', 'Education'],
  ['/faq', 'FAQ'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms'],
  ['/order-fail', 'Order fail'],
  ['/order-pending', 'Order pending'],
  ['/order-success', 'Order success'],
  ['/search', 'Search'],
  ['/ratings', 'Ratings'],
  ['/subscriptions', 'Subscriptions'],
  ['/auth', 'Auth'],
  ['/courses', 'Courses list'],
  ['/books', 'Books list'],
  ['/trips', 'Trips list'],
  ['/clinic', 'Clinic list'],
  ['/consultations', 'Consultations list'],
  ['/community', 'Community home'],
  ['/community/blogs', 'Community blogs list'],
  ['/community/researches', 'Community researches list'],
  ['/community/theories', 'Community theories list'],
  ['/community/chat', 'Community chat'],
  ['/community/cooperation', 'Community cooperation'],
  ['/community/podcast-request', 'Community podcast request'],
  ['/podcasts', 'Podcasts'],
  ['/encyclopedia', 'Encyclopedia'],
  ['/monograph', 'Monograph list'],
];

const DYNAMIC_ROUTES: [string, string][] = [
  [`/courses/${IDS.course}`, 'Course detail'],
  [`/books/${IDS.book}`, 'Book detail'],
  [`/trips/${IDS.trip}`, 'Trip detail'],
  [`/trips/${IDS.trip}/initial-consultation`, 'Trip initial consultation'],
  [`/clinic/${IDS.clinic}`, 'Clinic detail'],
  [`/clinic/${IDS.clinic}/book`, 'Clinic booking'],
  [`/clinic/${IDS.clinic}/initial-consultation`, 'Clinic initial consultation'],
  [`/consultations/${IDS.doctor}/book`, 'Doctor booking'],
  [`/community/blogs/${IDS.blogPost}`, 'Community blog detail'],
  [`/community/researches/${IDS.researchPost}`, 'Community research detail'],
  [`/community/theories/${IDS.theoryPost}`, 'Community theory detail'],
  [`/monograph/${IDS.monograph}`, 'Monograph detail'],
  [`/encyclopedia/${IDS.encyclopediaNews}?kind=news`, 'Encyclopedia news detail'],
  [`/encyclopedia/${IDS.encyclopediaHerb}?kind=herb`, 'Encyclopedia herb detail'],
];

// Auth-gated URLs: guests must see a graceful "please sign in" state, never a crash.
const AUTH_GATED_ROUTES: [string, string][] = [
  [`/learn/${IDS.course}`, 'Course player (guest)'],
  [`/read/${IDS.book}`, 'Book reader (guest)'],
  [`/checkout/course/${IDS.course}`, 'Course checkout (guest)'],
];

test.describe('Public routes render cleanly', () => {
  for (const [path, label] of [...STATIC_ROUTES, ...DYNAMIC_ROUTES]) {
    test(`${label} (${path})`, async ({ page }) => {
      await visitAndAssertClean(page, path, label);
    });
  }

  for (const [path, label] of AUTH_GATED_ROUTES) {
    test(`${label} (${path}) shows an auth requirement, not a crash`, async ({ page }) => {
      await visitAndAssertClean(page, path, label);

      // Prefer the rendered login form over a phrase match. These routes send a
      // guest to the real auth form, whose button reads "دخول" — the previous
      // regex only looked for the longer "تسجيل الدخول" and so reported a
      // correctly-gated page as a failure.
      const hasLoginForm = await page.locator('#auth-email').count() > 0;

      const bodyText = await page.locator('body').innerText();
      const hasAuthPrompt =
        /authentication is required|sign in|log in|تسجيل الدخول|يجب تسجيل الدخول|مرحباً بعودتك/i.test(bodyText);

      expect(
        hasLoginForm || hasAuthPrompt,
        `${label}: expected a sign-in prompt or the login form for a guest, got: ${bodyText.slice(0, 300)}`,
      ).toBeTruthy();
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Header + footer navigation, enumerated from the DOM at runtime.
// ---------------------------------------------------------------------------

test.describe('Header and footer navigation', () => {
  test('every header/footer link on the homepage navigates cleanly', async ({ page }) => {
    await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded' });
    await expectNoErrorOverlay(page, 'Home (for nav enumeration)');

    const hrefs = await page.evaluate(() => {
      const collect = (root: Element | null) =>
        root ? Array.from(root.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') || '') : [];
      return [...collect(document.querySelector('header')), ...collect(document.querySelector('footer'))];
    });

    const internal = [...new Set(hrefs)].filter(
      (href) => href.startsWith('/') && !href.startsWith('//') && href !== '',
    );

    expect(internal.length, 'expected header/footer to expose at least one internal link').toBeGreaterThan(0);

    for (const href of internal) {
      await visitAndAssertClean(page, href, `Nav link ${href}`);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Seeded lists render non-empty content.
// ---------------------------------------------------------------------------

test.describe('Seeded data actually renders', () => {
  test('courses list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/courses`, { waitUntil: 'networkidle' });
    const cards = page.locator('a[href^="/courses/"]');
    await expect(cards.first(), 'GET /api/user/courses returned no active courses').toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('books list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/books`, { waitUntil: 'networkidle' });
    const cards = page.locator('a[href^="/books/"]');
    await expect(cards.first(), 'GET /api/user/books returned no active books').toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('trips list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/trips`, { waitUntil: 'networkidle' });
    const cards = page.locator('a[href^="/trips/"]');
    await expect(cards.first(), 'GET /api/user/trips returned no active trips').toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('clinics list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/clinic`, { waitUntil: 'networkidle' });
    const cards = page.locator('a[href^="/clinic/"]');
    await expect(cards.first(), 'GET /api/user/clinics returned no active clinics').toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('consultations list shows doctors', async ({ page }) => {
    await page.goto(`${SITE}/consultations`, { waitUntil: 'networkidle' });
    const bodyText = await page.locator('body').innerText();
    const noDoctorsMessage = /لا يوجد أطباء متاحون|no doctors are available/i.test(bodyText);
    expect(
      noDoctorsMessage,
      'GET /api/user/consultations doctors endpoint returned an empty list despite seeded doctors',
    ).toBeFalsy();
  });

  test('community blogs (articles) list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/community/blogs`, { waitUntil: 'networkidle' });
    const cards = page.locator('a[href^="/community/blogs/"]');
    await expect(cards.first(), 'community posts (type=article) endpoint returned nothing for guests').toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('community theories list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/community/theories`, { waitUntil: 'networkidle' });
    const cards = page.locator('a[href^="/community/theories/"]');
    await expect(cards.first(), 'community posts (type=theory) endpoint returned nothing for guests').toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('community researches: content or an explicit subscription gate, never a silent empty list', async ({ page }) => {
    await page.goto(`${SITE}/community/researches`, { waitUntil: 'networkidle' });
    const cardCount = await page.locator('a[href^="/community/researches/"]').count();
    const bodyText = await page.locator('body').innerText();
    const hasGateCta = /sign in and subscribe|available to active subscribers|تسجيل الدخول|المشتركين النشطين/i.test(
      bodyText,
    );
    expect(
      cardCount > 0 || hasGateCta,
      'community posts (type=research) rendered neither items nor a subscription/sign-in gate — likely a silently empty list',
    ).toBeTruthy();
  });

  test('podcasts list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/podcasts`, { waitUntil: 'networkidle' });
    const bodyText = await page.locator('body').innerText();
    // Seeded episode titles (English catalog names) that must appear somewhere on the page.
    const hasKnownEpisode = /Introduction to Health Sciences|Medicinal Herbs|مقدمة في العلوم الصحية|الأعشاب الطبية/i.test(
      bodyText,
    );
    expect(hasKnownEpisode, 'GET /api/user/podcasts returned no published episodes despite seeded data').toBeTruthy();
  });

  test('encyclopedia (news + herbal library) renders seeded entries', async ({ page }) => {
    await page.goto(`${SITE}/encyclopedia`, { waitUntil: 'networkidle' });
    const entryLinks = page.locator('a[href^="/encyclopedia/"]');
    await expect(entryLinks.first(), '/api/user/encyclopedia/news and /herbal returned no entries').toBeVisible();
    expect(await entryLinks.count()).toBeGreaterThan(0);
  });

  test('monograph (plants/fungi) list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/monograph`, { waitUntil: 'networkidle' });
    const cards = page.locator('a[href^="/monograph/"]');
    await expect(cards.first(), 'GET /api/user/plants-fungi returned no active entries').toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('FAQ list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/faq`, { waitUntil: 'networkidle' });
    const bodyText = await page.locator('body').innerText();
    const noFaqsMessage = /no faqs have been published|لا توجد أسئلة شائعة منشورة/i.test(bodyText);
    expect(noFaqsMessage, 'GET FAQ endpoint returned no published FAQs despite 6 seeded rows').toBeFalsy();
  });

  test('ratings/reviews list shows approved reviews', async ({ page }) => {
    await page.goto(`${SITE}/ratings`, { waitUntil: 'networkidle' });
    const bodyText = await page.locator('body').innerText();
    const noReviewsMessage = /no approved reviews yet|لا توجد تقييمات معتمدة/i.test(bodyText);
    expect(
      noReviewsMessage,
      'platform reviews endpoint returned no approved reviews despite 3 seeded approved rows',
    ).toBeFalsy();
  });

  test('subscriptions list is non-empty', async ({ page }) => {
    await page.goto(`${SITE}/subscriptions`, { waitUntil: 'networkidle' });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length, 'subscriptions page rendered essentially no content').toBeGreaterThan(50);
  });
});

// ---------------------------------------------------------------------------
// 4. Listing -> detail click-throughs.
// ---------------------------------------------------------------------------

test.describe('Detail pages render real content from a listing click-through', () => {
  test('course card -> course detail', async ({ page }) => {
    await page.goto(`${SITE}/courses`, { waitUntil: 'networkidle' });
    const link = page.locator('a[href^="/courses/"]').first();
    const title = (await link.innerText()).trim();
    await link.click();
    await page.waitForURL(/\/courses\/\d+/);
    await expectNoErrorOverlay(page, 'Course detail');
    await expect(page.locator('h1')).not.toBeEmpty();
    expect((await page.locator('body').innerText())).toContain(title.split('\n')[0]);
    // Price is rendered as a formatted currency string.
    await expect(page.getByText(/[\d٠-٩]/).first()).toBeVisible();
  });

  test('book card -> book detail', async ({ page }) => {
    await page.goto(`${SITE}/books`, { waitUntil: 'networkidle' });
    const link = page.locator('a[href^="/books/"]').first();
    await link.click();
    await page.waitForURL(/\/books\/\d+/);
    await expectNoErrorOverlay(page, 'Book detail');
    await expect(page.locator('h1')).not.toBeEmpty();
  });

  test('trip card -> trip detail', async ({ page }) => {
    await page.goto(`${SITE}/trips`, { waitUntil: 'networkidle' });
    const link = page.locator('a[href^="/trips/"]').first();
    await link.click();
    await page.waitForURL(/\/trips\/\d+/);
    await expectNoErrorOverlay(page, 'Trip detail');
    await expect(page.locator('h1')).not.toBeEmpty();
  });

  test('clinic card -> clinic detail', async ({ page }) => {
    await page.goto(`${SITE}/clinic`, { waitUntil: 'networkidle' });
    const link = page.locator('a[href^="/clinic/"]').first();
    await link.click();
    await page.waitForURL(/\/clinic\/\d+$/);
    await expectNoErrorOverlay(page, 'Clinic detail');
    await expect(page.locator('h1')).not.toBeEmpty();
  });

  test('community blog card -> blog detail', async ({ page }) => {
    await page.goto(`${SITE}/community/blogs`, { waitUntil: 'networkidle' });
    const link = page.locator('a[href^="/community/blogs/"]').first();
    await link.click();
    await page.waitForURL(/\/community\/blogs\/\d+/);
    await expectNoErrorOverlay(page, 'Community blog detail');
    await expect(page.locator('h1')).not.toBeEmpty();
  });

  test('encyclopedia entry card -> entry detail', async ({ page }) => {
    await page.goto(`${SITE}/encyclopedia`, { waitUntil: 'networkidle' });
    const link = page.locator('a[href^="/encyclopedia/"]').first();
    await link.click();
    await page.waitForURL(/\/encyclopedia\/\d+/);
    await expectNoErrorOverlay(page, 'Encyclopedia entry detail');
    await expect(page.locator('h1')).not.toBeEmpty();
  });

  test('monograph card -> monograph detail', async ({ page }) => {
    await page.goto(`${SITE}/monograph`, { waitUntil: 'networkidle' });
    const link = page.locator('a[href^="/monograph/"]').first();
    await link.click();
    await page.waitForURL(/\/monograph\/\d+/);
    await expectNoErrorOverlay(page, 'Monograph detail');
    await expect(page.locator('h1')).not.toBeEmpty();
  });
});

// ---------------------------------------------------------------------------
// 5. Language switcher.
// ---------------------------------------------------------------------------

test.describe('Language switcher', () => {
  test('toggling language changes <html lang>/dir and visible copy', async ({ page }) => {
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });

    const initialLang = await page.evaluate(() => document.documentElement.lang);
    const initialDir = await page.evaluate(() => document.documentElement.dir);
    // Site defaults to Arabic/RTL (src/LanguageContext.tsx).
    expect(initialLang).toBe('ar');
    expect(initialDir).toBe('rtl');

    // Look for an actual language-switching control anywhere in the DOM: a button/link
    // whose accessible name or text plausibly toggles the site language (EN/AR/English/عربي).
    const candidates = page.locator(
      [
        '[data-testid*="language" i]',
        '[aria-label*="language" i]',
        '[aria-label*="لغة" i]',
        'button:has-text("EN")',
        'button:has-text("AR")',
        'button:has-text("English")',
        'button:has-text("العربية")',
        'a:has-text("EN")',
        'a:has-text("English")',
        'a:has-text("العربية")',
      ].join(', '),
    );

    const count = await candidates.count();
    expect(
      count,
      'No language-switcher control found anywhere in the DOM (checked header/footer/body). ' +
        'src/LanguageContext.tsx exposes setLanguage(), but a repo-wide search found zero real UI callers of it ' +
        '(only src/lib/i18n/language-persistence.test.tsx calls setLanguage — a test harness, not app UI). ' +
        'Guests have no way to switch to English in the browser.',
    ).toBeGreaterThan(0);

    await candidates.first().click();
    await page.waitForFunction((prevLang) => document.documentElement.lang !== prevLang, initialLang);
    const newLang = await page.evaluate(() => document.documentElement.lang);
    const newDir = await page.evaluate(() => document.documentElement.dir);
    expect(newLang).not.toBe(initialLang);
    expect(newDir).not.toBe(initialDir);
  });
});

// ---------------------------------------------------------------------------
// 6. Search.
// ---------------------------------------------------------------------------

test.describe('Search', () => {
  test(`searching "${SEARCH_TERM}" returns results from seeded data`, async ({ page }) => {
    await page.goto(`${SITE}/search`, { waitUntil: 'domcontentloaded' });
    const input = page.locator('input').first();
    await input.fill(SEARCH_TERM);
    await page.waitForResponse((res) => res.url().includes('/api/user/search') && res.status() < 500, {
      timeout: 15_000,
    });
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText, `search endpoint GET /api/user/search?q=${SEARCH_TERM} returned no matches`).not.toMatch(
      /no matching results|لا توجد نتائج مطابقة/i,
    );
    expect(await page.locator('a').filter({ hasText: /./ }).count()).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Auth-gated actions while logged out.
// ---------------------------------------------------------------------------

test.describe('Auth-gated actions prompt for login instead of failing silently', () => {
  async function expectAuthPrompt(page: Page, label: string) {
    // Either an in-page auth dialog (AuthRequiredDialog) or a navigation to /auth is acceptable.
    const dialogOrAuthPage = page
      .locator('form')
      .filter({ has: page.locator('input[type="email"], input[type="password"]') })
      .first();
    await expect(dialogOrAuthPage, `${label}: expected a login form to appear for a guest`).toBeVisible({
      timeout: 10_000,
    });
  }

  test('favorite button on a course detail page requires login', async ({ page }) => {
    await page.goto(`${SITE}/courses/${IDS.course}`, { waitUntil: 'networkidle' });
    const favoriteButton = page.locator('button[aria-label*="favorite" i], button[aria-label*="مفضلة"]').first();
    await favoriteButton.click();
    await expectAuthPrompt(page, 'Favorite (course)');
  });

  test('enroll on a course detail page requires login', async ({ page }) => {
    await page.goto(`${SITE}/courses/${IDS.course}`, { waitUntil: 'networkidle' });
    const enrollButton = page.getByRole('button', { name: /enroll and pay|التسجيل والدفع/i }).first();
    await enrollButton.click();
    await expectAuthPrompt(page, 'Enroll (course)');
  });

  test('booking a doctor consultation requires login', async ({ page }) => {
    await page.goto(`${SITE}/consultations`, { waitUntil: 'networkidle' });
    const bookButton = page.getByRole('button', { name: /book video|book text|حجز مرئي|حجز نصي/i }).first();
    await expect(bookButton, 'no booking button rendered for seeded doctors').toBeVisible();
    await bookButton.click();
    await expectAuthPrompt(page, 'Book consultation');
  });

  test('submitting a platform review requires login', async ({ page }) => {
    await page.goto(`${SITE}/ratings`, { waitUntil: 'networkidle' });
    // Fill valid input first so the auth gate — not client-side validation — is what triggers.
    const stars = page.locator('button, [role="radio"], svg').filter({ hasText: '' });
    // RatingStars is icon-based; click the 5th star icon container by position if present.
    const starButtons = page.locator('button');
    const count = await starButtons.count();
    for (let i = 0; i < count; i += 1) {
      const el = starButtons.nth(i);
      const aria = (await el.getAttribute('aria-label')) || '';
      if (/star|نجم|تقييم/i.test(aria)) {
        await el.click();
        break;
      }
    }
    const textarea = page.locator('textarea').first();
    if (await textarea.count()) {
      await textarea.fill('This is a genuine review with enough characters.');
    }
    const submitButton = page.getByRole('button', { name: /submit|إرسال/i }).first();
    await submitButton.click();
    await expectAuthPrompt(page, 'Submit review');
  });
});
