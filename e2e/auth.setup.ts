import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ADMIN, DASHBOARD } from './helpers';

/**
 * Log into the dashboard ONCE and persist the session.
 *
 * Every dashboard test previously logged in itself. On this machine a login
 * costs ~19s, so a 15-test file spent five minutes just authenticating and blew
 * its per-test timeout before asserting anything — failures that looked like app
 * bugs but were pure setup cost.
 */
const AUTH_DIR = path.join(process.cwd(), 'e2e', '.auth');
export const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  setup.setTimeout(180_000);
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await page.goto(`${DASHBOARD}/admin`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', ADMIN.email);
  await page.fill('input[name="password"]', ADMIN.password);
  await Promise.all([
    page.waitForURL(/\/admin\/home/, { timeout: 120_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.context().storageState({ path: ADMIN_STATE });
});
