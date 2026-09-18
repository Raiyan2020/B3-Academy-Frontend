import { expect, test as setup } from '@playwright/test';
import path from 'node:path';
import { SITE, USER } from './helpers';

export const SITE_STATE = path.join(process.cwd(), 'e2e', '.auth', 'site-user.json');

/**
 * Log the seeded site user in once and save the resulting browser state.
 *
 * `/api/v1/user/login` is throttled to 5 attempts per minute, and the account
 * specs have well over 30 tests that each used to log in from scratch — so the
 * suite throttled itself and the failures looked like application bugs. Logging
 * in once here and replaying the stored state keeps the whole run under the
 * limit.
 *
 * The site keeps its Sanctum token in localStorage (`b3_api_token`), which
 * Playwright's storageState captures alongside cookies. No token is injected by
 * hand: this goes through the real form.
 */
setup('authenticate as site user', async ({ page }) => {
  await page.goto(`${SITE}/auth`, { waitUntil: 'domcontentloaded' });

  // The Next dev server serves HTML before the bundle hydrates, so a fill can
  // land before React attaches onChange and then be wiped by hydration.
  const fillStable = async (selector: string, value: string) => {
    const locator = page.locator(selector);
    await expect(async () => {
      await locator.fill(value);
      await expect(locator).toHaveValue(value);
    }).toPass({ timeout: 15_000 });
  };

  // Both fields must hold their values *together*, not each at its own fill
  // time. Filling email, then password, let a hydration re-render land in
  // between and wipe the email back to its empty controlled value — the form
  // then submitted with a blank email and never navigated.
  await expect(async () => {
    await fillStable('#auth-email', USER.email);
    await fillStable('#auth-password', USER.password);
    await expect(page.locator('#auth-email')).toHaveValue(USER.email);
  }).toPass({ timeout: 30_000 });

  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 60_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.context().storageState({ path: SITE_STATE });
});
