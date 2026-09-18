import { defineConfig } from '@playwright/test';
import path from 'node:path';

/**
 * End-to-end coverage for both halves of the product: the Next.js site on :3000
 * and the Laravel Blade admin dashboard on :8000.
 *
 * The servers are NOT started here on purpose — both are long-running dev
 * processes with their own state (a seeded sqlite database), and letting the
 * runner boot and kill them would make a failing test indistinguishable from a
 * server that simply had not finished starting.
 *
 * Timeouts are deliberately generous. This is a dev-mode Next server compiling
 * routes on first visit plus a single-threaded `php artisan serve`; under load a
 * page can take 20s. Tight timeouts here produce failures that look like app
 * bugs but are really the harness outrunning the server.
 */
// This config is loaded as an ES module, where __dirname does not exist.
const ADMIN_STATE = path.join(process.cwd(), 'e2e', '.auth', 'admin.json');
const SITE_USER_STATE = path.join(process.cwd(), 'e2e', '.auth', 'site-user.json');

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 2,
  retries: 1,
  reporter: [['list'], ['json', { outputFile: 'e2e-results.json' }]],
  use: {
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      // Dashboard specs reuse the stored admin session instead of logging in
      // per test.
      name: 'dashboard',
      testMatch: /(dashboard-crud|verify-claims|dashboard-exports)\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: ADMIN_STATE },
    },
    {
      // Full-surface screenshot sweep. Reports, never gates.
      name: 'evidence',
      testMatch: /(evidence|audit-all)\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: ADMIN_STATE },
    },
    {
      // Public site pages: no session on purpose, so guest behaviour is what
      // gets tested.
      name: 'site',
      testMatch: /(site-public|smoke)\.spec\.ts/,
    },
    { name: 'site-setup', testMatch: /site-auth\.setup\.ts/ },
    {
      // Account pages replay one stored login. `/api/v1/user/login` is throttled
      // to 5 attempts per minute and these specs have well over 30 tests, so
      // logging in per test throttled the suite against itself.
      name: 'site-account',
      testMatch: /site-account\.spec\.ts/,
      dependencies: ['site-setup'],
      use: { storageState: SITE_USER_STATE },
    },
  ],
});
