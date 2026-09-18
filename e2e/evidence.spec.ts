import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { DASHBOARD, SITE, loginDashboard } from './helpers';

/**
 * Evidence sweep: walk every route and save a screenshot of anything broken,
 * plus a machine-readable findings file. This is a REPORTER, not a gate — it
 * never fails, so a broken page produces evidence instead of aborting the walk.
 * The assertions that actually gate live in the other specs.
 */
const OUT = path.join(process.cwd(), 'e2e-evidence');
const SHOTS = path.join(OUT, 'screenshots');

type Finding = {
  surface: 'dashboard' | 'site';
  url: string;
  status: number;
  problem: string;
  detail: string;
  screenshot: string;
};

const findings: Finding[] = [];

const ERROR_MARKERS = [
  'Whoops, looks like something went wrong',
  'Unable to locate a class or view',
  'syntax error',
  'SQLSTATE',
  'lazy load',
  'Undefined variable',
  'Call to undefined',
  'Application error',
  'Unhandled Runtime Error',
  'This page could not be found',
];

function slug(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 110);
}

async function inspect(page: import('@playwright/test').Page, surface: Finding['surface'], url: string) {
  let status = 0;
  let problem = '';
  let detail = '';

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    status = response?.status() ?? 0;
  } catch (error) {
    problem = 'navigation failed';
    detail = (error as Error).message.slice(0, 200);
  }

  const body = problem ? '' : await page.locator('body').innerText().catch(() => '');

  if (!problem && status >= 500) {
    problem = `HTTP ${status}`;
  }
  if (!problem) {
    const marker = ERROR_MARKERS.find((m) => body.includes(m));
    if (marker) {
      problem = 'error rendered on page';
      detail = (body.split('\n').find((l) => l.includes(marker)) || marker).trim().slice(0, 220);
    }
  }
  // A DataTables grid that reports rows exist but renders none is a silent failure.
  if (!problem) {
    const emptyPlaceholder = await page.locator('td.dataTables_empty').count().catch(() => 0);
    if (emptyPlaceholder > 0) {
      problem = 'grid renders "no data" placeholder';
      detail = 'DataTables returned no rows for this grid';
    }
  }

  if (!problem) return;

  const file = path.join(SHOTS, `${surface}__${slug(url)}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  findings.push({ surface, url, status, problem, detail, screenshot: path.relative(OUT, file) });
  // eslint-disable-next-line no-console
  console.log(`BROKEN [${surface}] ${status} ${url} :: ${problem}${detail ? ` :: ${detail}` : ''}`);
}

test.beforeAll(() => {
  fs.mkdirSync(SHOTS, { recursive: true });
});

test.afterAll(() => {
  fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify(findings, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\n=== ${findings.length} broken surface(s); evidence in ${OUT} ===`);
});

test('dashboard evidence sweep', async ({ page }) => {
  test.setTimeout(1_800_000);
  await loginDashboard(page);

  const routes: string[] = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'e2e', 'dashboard-routes.json'), 'utf8'),
  );
  for (const route of routes) {
    await inspect(page, 'dashboard', `${DASHBOARD}${route}`);
  }
});

test('site evidence sweep', async ({ page }) => {
  test.setTimeout(1_800_000);

  const routes: string[] = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'e2e', 'site-routes.json'), 'utf8'),
  );
  for (const route of routes) {
    await inspect(page, 'site', `${SITE}${route}`);
  }
});
