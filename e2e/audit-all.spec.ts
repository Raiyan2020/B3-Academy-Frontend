import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { DASHBOARD, SITE, loginDashboard, watchForErrors } from './helpers';

import dashboardRoutes from './dashboard-routes.json' with { type: 'json' };
import siteRoutes from './site-routes.json' with { type: 'json' };

/**
 * Whole-surface audit. This is a REPORTER, not an assertion suite: it must
 * visit every route even when early ones are broken, so it never fails. The
 * JSON it writes is the input to the fix plan.
 */

const OUT = path.join(process.cwd(), 'e2e-evidence');

/** Body text that means the page blew up rather than rendered. */
const ERROR_MARKERS = [
  'Application error',
  'Unhandled Runtime Error',
  'This page could not be found',
  'Internal Server Error',
  'Whoops, looks like something went wrong',
  'SQLSTATE',
  'Undefined variable',
  'Call to undefined',
  'Unable to locate',
  'lazy load',
  'syntax error',
];

/**
 * Console noise that is not a defect: dev-server plumbing, third-party embeds,
 * and the browser's own warnings about resources we do not control.
 */
const CONSOLE_NOISE = [
  'Download the React DevTools',
  'favicon',
  'net::ERR_INTERNET_DISCONNECTED',
  '[Fast Refresh]',
  'Failed to load resource: the server responded with a status of 404',
];

/** Requests whose failure says nothing about the page under test. */
const REQUEST_NOISE = ['/favicon', 'fonts.gstatic', 'google-analytics', '/_next/static/webpack'];

type Finding = {
  surface: 'dashboard' | 'site';
  route: string;
  status: number;
  errorMarker?: string;
  consoleErrors: string[];
  failedRequests: string[];
  deadLinks: string[];
  links: string[];
  title: string;
};

function keep(list: string[], noise: string[]) {
  return [...new Set(list.filter((entry) => !noise.some((n) => entry.includes(n))))];
}

/**
 * Collect every anchor on the page plus the ones that cannot navigate.
 *
 * A dead link is an anchor a user can click that goes nowhere: no href, or an
 * href of `#` / `javascript:void(0)` with no click handler and no data-* hook
 * that scripts on this codebase use to wire behaviour (modal toggles, delete
 * confirms, DataTables row actions).
 */
async function collectLinks(page: import('@playwright/test').Page, origin: string) {
  return page.evaluate((base) => {
    const anchors = [...document.querySelectorAll('a')];
    const links: string[] = [];
    const dead: string[] = [];

    for (const a of anchors) {
      const raw = a.getAttribute('href');
      const label = (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 60);

      const wired =
        a.hasAttribute('onclick') ||
        a.hasAttribute('data-bs-toggle') ||
        a.hasAttribute('data-toggle') ||
        a.hasAttribute('data-id') ||
        a.hasAttribute('data-url') ||
        a.classList.contains('dropdown-toggle') ||
        a.closest('[data-bs-toggle], [data-toggle]') !== null;

      if (!raw || raw === '#' || raw.startsWith('javascript:')) {
        if (!wired) dead.push(`${raw ?? '(no href)'} :: ${label}`);
        continue;
      }
      if (raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('http') && !raw.startsWith(base)) {
        continue;
      }
      try {
        links.push(new URL(raw, base).toString());
      } catch {
        dead.push(`${raw} :: ${label}`);
      }
    }

    return { links: [...new Set(links)], dead: [...new Set(dead)] };
  }, origin);
}

async function auditRoute(
  page: import('@playwright/test').Page,
  surface: Finding['surface'],
  origin: string,
  route: string,
): Promise<Finding> {
  const { consoleErrors, failedRequests } = watchForErrors(page);

  let status = 0;
  try {
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    status = response?.status() ?? 0;
    // Give client-rendered pages and DataTables their XHR round-trip.
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  } catch (error) {
    consoleErrors.push(`navigation: ${(error as Error).message}`);
  }

  const body = (await page.locator('body').innerText().catch(() => '')) || '';
  const title = (await page.title().catch(() => '')) || '';
  const { links, dead } = await collectLinks(page, origin).catch(() => ({ links: [], dead: [] }));

  return {
    surface,
    route,
    status,
    errorMarker: ERROR_MARKERS.find((m) => body.includes(m)),
    consoleErrors: keep(consoleErrors, CONSOLE_NOISE),
    failedRequests: keep(failedRequests, REQUEST_NOISE),
    deadLinks: dead,
    links,
    title,
  };
}

function write(name: string, findings: Finding[]) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(findings, null, 2));

  const broken = findings.filter(
    (f) => f.status >= 400 || f.errorMarker || f.consoleErrors.length || f.failedRequests.length || f.deadLinks.length,
  );
  console.log(`\n=== ${name}: ${findings.length} routes, ${broken.length} with findings ===`);
  for (const f of broken) {
    const bits = [
      f.status >= 400 ? `HTTP ${f.status}` : '',
      f.errorMarker ? `marker:${f.errorMarker}` : '',
      f.consoleErrors.length ? `console:${f.consoleErrors.length}` : '',
      f.failedRequests.length ? `req:${f.failedRequests.length}` : '',
      f.deadLinks.length ? `dead:${f.deadLinks.length}` : '',
    ].filter(Boolean);
    console.log(`  ${f.route.padEnd(52)} ${bits.join(' ')}`);
  }
}

test('audit every dashboard route', async ({ page }) => {
  test.setTimeout(45 * 60_000);
  await loginDashboard(page);

  const findings: Finding[] = [];
  for (const route of dashboardRoutes as string[]) {
    findings.push(await auditRoute(page, 'dashboard', DASHBOARD, route));
  }
  write('audit-dashboard.json', findings);
});

test('audit every site route', async ({ page }) => {
  test.setTimeout(45 * 60_000);

  const findings: Finding[] = [];
  for (const route of siteRoutes as string[]) {
    findings.push(await auditRoute(page, 'site', SITE, route));
  }
  write('audit-site.json', findings);
});
