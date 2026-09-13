# Next.js 16 Architecture Audit — B3 Academy

Read-only audit. No code was modified. Scope: `src/` only (`backend/` is an unrelated Laravel app and was excluded from every search). Next.js 16.2.9, React 19.2.1, App Router, Turbopack.

Baseline re-used from prior work (not re-measured): typecheck 0 errors; 20 test files / 59 tests pass; `npx eslint src` → 3 `react-hooks/exhaustive-deps` warnings only, with `react-hooks/rules-of-hooks`, `react-hooks/set-state-in-effect`, `react-hooks/purity`, `@next/next/no-img-element`, `jsx-a11y/alt-text` disabled. Data fetching / TanStack Query is out of scope (covered by a parallel audit).

`npm run build` was run for this audit (exit 0) to get real route-type data; the Turbopack output is quoted throughout §6.

---

## Next 16 version notes

Confirmed via context7 (`/vercel/next.js/v16.2.9`, official docs), and independently corroborated by the project's own `npm run build` output:

- **`middleware.ts` → `proxy.ts`**: `middleware` is a **deprecated file convention** in Next 16, renamed to `proxy`. The build the audit ran printed this verbatim: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`. Docs source (`docs/01-app/02-guides/upgrading/version-16.mdx`): rename the file (`mv middleware.ts proxy.ts`) and rename the exported function `middleware` → `proxy`. Config flag `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`. Critically, **`proxy` does not support the `edge` runtime** — it always runs on `nodejs` and this is not configurable; if edge runtime is required, `middleware.ts` must be kept. A codemod exists: `npx @next/codemod@canary middleware-to-proxy .`. `src/middleware.ts` does not set a runtime, so migrating is safe.
- **fetch caching default**: unchanged since Next 15 — `fetch` is **not cached by default**; opt in per-call with `{ cache: 'force-cache' }`, or wrap a function/component in `'use cache'` (requires `cacheComponents: true` in `next.config.ts`, which this project does not set). `next.config.ts` here only sets `images.remotePatterns`, so no cache-affecting flags are present.
- **async `params` / `searchParams`**: both are `Promise`-typed on `page.tsx` / `layout.tsx` / `generateMetadata`, and must be awaited (`const { slug } = await params`). This has been true since Next 15 and is unchanged in 16.
- **Turbopack**: stable and the **default bundler** for both `next dev` and `next build` in Next 16 — no `--turbopack` flag needed. The project's build output confirms `▲ Next.js 16.2.9 (Turbopack)`.
- **`next/image`**: `priority` is **deprecated in Next 16** in favor of `preload`. Default `quality` is 75; as of Next 16 `images.qualities` defaults to `[75]` only (a specified `quality` outside the configured array is coerced to the nearest allowed value). `loading` defaults to `lazy`.
- **Route segment config** (`dynamic`, `revalidate`, `fetchCache`, `runtime`, `dynamicParams`) — still valid exports in 16; none are used anywhere in `src/app` (confirmed by grep, §6).

---

## 1. Server/client boundary

`grep -rl "'use client'" src` → **278 files** (single-quote directive style is used throughout; double-quote `"use client"` appears in only 5 files, e.g. `src/components/ui/command.tsx`).

`find src/app -name page.tsx` → **94 files**. `grep -l "'use client'" <those>` → **90 files are `'use client'`**. This corroborates the parallel audit's number exactly. The 4 server page.tsx are:
- `src/app/(account)/settings/page.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(site)/books/page.tsx`
- `src/app/(site)/courses/page.tsx`

Of the 3 `layout.tsx` files below root, 2 are `'use client'` (`(admin)/admin/layout.tsx`, `(doctor)/doctor/layout.tsx`); the root `src/app/layout.tsx` is a clean Server Component.

**Root cause, not just a count.** Every dynamic page reads route params via `useParams()`/`useSearchParams()` from `src/lib/routing/next-router-compat.tsx` — a React-Router-style shim (`Link`, `useNavigate`, `useLocation`, `useParams`, `Navigate`) built on `next/navigation`'s **client** hooks:

```ts
// src/lib/routing/next-router-compat.tsx
'use client';
import NextLink from 'next/link';
import { useParams as useNextParams, usePathname, useRouter } from 'next/navigation';
...
export function useParams<T>() { const params = useNextParams(); ... }
```

No `page.tsx` in `src/app` destructures a `params` or `searchParams` **prop** at all (`grep -rn "params:" src/app --include=page.tsx` → 0 matches). Route params are instead read client-side, one level down, inside feature components (e.g. `src/app/(site)/courses/[courseId]/page.tsx` is a 12-line `'use client'` shell that renders `<CourseDetailPage />`, which itself calls `useParams()`). This is why 90/94 pages are client: the app was ported from a client-routed (React Router-shaped) app onto the App Router without moving param/data access to the server. Structural consequence: none of these pages can be Server Components, none can call `generateMetadata`, and Next can't statically resolve their route params server-side — everything downstream of "read the URL" is client JS.

```
Issue:            App is architected as a client-routed SPA on top of the App Router: every dynamic page reads params/searchParams via client hooks (useNextParams/useSearchParams) instead of the server params prop, forcing 90/94 pages to 'use client'.
Location:         src/lib/routing/next-router-compat.tsx:1-77 (root cause); consumed by 14+ files including src/app/(site)/courses/[courseId]/page.tsx:1-12, src/app/(site)/consultations/[doctorId]/book/page.tsx:1-18
Severity:         P1
Why it matters:   Violates the project's own .cursor/server-first.md ("All components are Server Components by default"). Blocks per-page generateMetadata (see §4), forces client-side data fetching waterfalls, and ships router logic (useRouter/usePathname) into every route's client bundle.
Current behavior: page.tsx components are thin 'use client' shells whose only job is passing control to a feature component that re-reads the URL client-side.
Recommended solution: For pages that don't need interactivity in the shell itself, accept the Promise-typed `params`/`searchParams` props directly in page.tsx (await them), pass resolved values as plain props into the feature component, and keep 'use client' only on the leaf that needs state/handlers. Migrate off next-router-compat's useParams/useSearchParams per-route as pages are touched.
Risk:             Wide blast radius (14+ direct importers, and indirectly nearly every page) — do incrementally, not as one PR.
Verification method: After a page is converted, confirm `npm run build` still lists it correctly and that `generateMetadata` (if added) receives resolved params.
Status:           Open
```

```
Issue:            27 of 70 `*.service.ts` files carry a top-level 'use client' directive despite containing no React, no hooks, and no browser-only API beyond localStorage wrappers — they are plain async/sync function modules.
Location:         e.g. src/features/care/services/care-data.service.ts:1, src/features/account/services/account-records.service.ts:1, src/features/books/services/book-content.service.ts:1 (27 total, found via: files with 'use client' matching *.service.ts)
Severity:         P2
Why it matters:   'use client' on a non-component module doesn't do anything useful for React — it just certifies the module as client-safe and blocks it from being imported into a Server Component without pulling it into the client graph. Several of these are pure data-shaping/localStorage helpers that a Server Component (or a real API route) could call directly.
Current behavior: Directive is present but functionally inert other than restricting import contexts.
Recommended solution: Drop 'use client' from service modules that hold no components/hooks; keep it only where a service genuinely touches browser-only globals (localStorage-backed ones can keep it, or better, isolate the storage call at the call site).
Risk:             Low — directive removal is safe unless a service is imported only from client components today (verify per-file before deleting).
Verification method: `npm run build` + `npm run typecheck` after removal; confirm the module is still reachable from its current client call sites.
Status:           Open
```

```
Issue:            Leaf presentational components carry 'use client' with zero hooks, state, or event handlers.
Location:         src/features/books/ui/BookCard.tsx:1 (renders a next/link, no hooks); src/features/admin/components/admin-page-header.tsx:1 (pure props → JSX, no hooks)
Severity:         P1
Why it matters:   These are exactly the "leaf" components the server-first doc asks to keep server-rendered; forcing them client adds them and their entire import graph to the client bundle for no behavioral reason.
Current behavior: 'use client' at the top, component is a pure render function.
Recommended solution: Remove the directive; these components have no dependency on client-only APIs.
Risk:             Very low — verify the parent that renders them is not passing a function/JSX-as-children pattern that requires the child to also be client.
Verification method: Remove directive, run `npm run build && npm run typecheck`, visually smoke-test the page that renders it.
Status:           Open
```

The `Providers` component (`src/app/providers.tsx`, `'use client'`) wraps the whole app in 7 nested context providers and is itself rendered from the server root layout — this pattern is fine per Next's children-as-props rule (children stay Server Components unless they import client code themselves), so it is **not** the reason pages are client; the reason is §1's root cause above.

---

## 2. Page/layout structure — route-group coverage

```
find src/app -name layout.tsx / loading.tsx / error.tsx / not-found.tsx / global-error.tsx
```

| Route group | layout.tsx | loading.tsx | error.tsx | not-found.tsx |
|---|---|---|---|---|
| root (`src/app/`) | ✅ (Server) | ❌ | ❌ | ✅ (`src/app/not-found.tsx`) |
| `(site)` | ❌ | ❌ | ❌ | ❌ (inherits root) |
| `(account)` | ❌ | ❌ | ❌ | ❌ |
| `(admin)` | ✅ `admin/layout.tsx` (`'use client'`, role gate) | ❌ | ❌ | ❌ |
| `(auth)` | ❌ | ❌ | ❌ | ❌ |
| `(checkout)` | ❌ | ❌ | ❌ | ❌ |
| `(community)` | ❌ | ❌ | ❌ | ❌ |
| `(doctor)` | ✅ `doctor/layout.tsx` (`'use client'`, role gate) | ❌ | ❌ | ❌ |
| `(learn)` | ❌ | ❌ | ❌ | ❌ |
| `(library)` | ❌ | ❌ | ❌ | ❌ |

No `global-error.tsx` either. There is **zero `error.tsx` and zero `loading.tsx` anywhere in the tree** — confirmed by `find src/app -iname error.tsx` and `find src/app -name loading.tsx` both returning empty.

```
Issue:            No error.tsx exists anywhere in the app (0 files) — no route segment has an error boundary.
Location:         src/app/ (absence, all route groups)
Severity:         P1
Why it matters:   An unhandled render/data error in any page (all 94 of them) crashes to Next's default unstyled error screen with no recovery UI, no logging hook, and no "try again" affordance. This is worse for a mostly-client-rendered app (§1) where runtime errors are more likely to surface post-hydration.
Current behavior: No error boundaries; only a global not-found.tsx exists.
Recommended solution: Add at minimum a root src/app/error.tsx (Client Component, required by the API) and one for (admin)/(doctor) given they gate on role and are more failure-prone.
Risk:             None — additive.
Verification method: Throw in a test page, confirm the boundary renders instead of the default crash screen.
Status:           Open
```

```
Issue:            No loading.tsx exists anywhere (0 files), including on data-heavy detail routes that are server-dynamic (courses/[courseId], books/[bookId], encyclopedia/[entryId], etc — see §6 for the ƒ list).
Location:         src/app/ (absence)
Severity:         P2
Why it matters:   Dynamic (ƒ) routes render on demand; without loading.tsx there's no route-level Suspense fallback, so navigation to any dynamic detail page shows nothing until the whole page resolves. (Note: since these pages are all client components doing client-side fetching per the parallel data-fetching audit, the practical loading UX is likely handled ad hoc inside each component instead — but that's per-component reinvention, not a route-level convention.)
Current behavior: No loading.tsx anywhere.
Recommended solution: Add loading.tsx to the highest-traffic dynamic segments first: courses/[courseId], books/[bookId], clinic/[clinicId].
Risk:             None — additive.
Verification method: Throttle network, navigate to a dynamic route, confirm fallback renders.
Status:           Open
```

---

## 3. Async params / searchParams

Checked every `page.tsx`, `layout.tsx`, and the one `route.ts` for sync treatment of `params`/`searchParams`.

**Clean — no P0 found.** `grep -rn "params:" src/app --include=page.tsx --include=layout.tsx --include=route.ts` returns 0 matches: no file in `src/app` destructures a `params` prop (sync or async) at all. As documented in §1, every dynamic page instead reads the URL via the client-side `useParams()`/`useSearchParams()` hooks from `next/navigation` (directly, or through `next-router-compat.tsx`), which are synchronous **client** hooks and are unaffected by the server `params`-as-Promise change. One page uses `useSearchParams()` directly: `src/app/(site)/consultations/[doctorId]/book/page.tsx:6,13-17`.

This means the codebase incidentally sidesteps the Next 15/16 async-params breaking change entirely — but only because it never adopted the server `params` prop pattern in the first place (which is the §1 finding). One line, no padding: no accidental sync-Promise bugs exist because no page reads `params` as a prop.

---

## 4. Metadata & SEO

`grep -rl "export const metadata\|generateMetadata" src/app` → **1 file: `src/app/layout.tsx` only.**

```
Issue:            0 of 94 pages export metadata or generateMetadata — only the root layout sets a single static <title>/<description> for the entire site.
Location:         src/app/layout.tsx:12-15 (only metadata in the tree); absent from all src/app/**/page.tsx
Severity:         P1
Why it matters:   Every route — /courses/[courseId], /books/[bookId], /encyclopedia/[entryId], /clinic/[clinicId], the whole (site) marketing surface — serves the identical title "B3 Academy" / description "Academy of Natural Philosophy and Psychedelics" in search results and social shares. Combined with §1 (90/94 pages are 'use client', and generateMetadata can only be exported from a Server Component module), essentially the entire content catalog cannot get per-page SEO without first being converted toward the server pattern.
Current behavior: export const metadata = { title: 'B3 Academy', description: 'Academy of Natural Philosophy and Psychedelics' }; — static, singular, in root layout only.
Recommended solution: Prioritize generateMetadata for the highest-value indexable pages first: /courses/[courseId], /books/[bookId], /(site)/courses, /(site)/books, /encyclopedia/[entryId], /(site)/clinic/[clinicId], /(site)/page.tsx (home) — these are the public catalog/marketing pages search traffic would land on. Each needs its params/searchParams resolved server-side (§1) before generateMetadata is possible.
Risk:             None to add; requires the §1 server-conversion work to actually take effect for dynamic segments.
Verification method: View source / `curl` each route and confirm a distinct <title> per page.
Status:           Open
```

Root layout (`src/app/layout.tsx`) does have: `<html lang="ar" dir="rtl">` (good — locale and direction are set), `Alexandria` via `next/font/google`. It has **no `viewport` export**, **no title template** (`title: { template: '%s | B3 Academy', default: ... }`), and no icons/`openGraph`/`twitter` metadata block.

```
Issue:            No sitemap.ts or robots.ts anywhere under src/app.
Location:         src/app/ (absence)
Severity:         P2
Why it matters:   No machine-readable sitemap or crawl directives for the public (site)/(community)/(library) surfaces; search engines rely on discovery via links only.
Current behavior: Neither file convention is implemented.
Recommended solution: Add src/app/sitemap.ts (enumerate static + catalog dynamic routes) and src/app/robots.ts once the per-page metadata work above lands (a sitemap without unique titles/descriptions has limited value).
Risk:             None — additive.
Verification method: Hit /sitemap.xml and /robots.txt after adding, confirm valid output.
Status:           Open
```

---

## 5. Middleware

`src/middleware.ts` (58 lines) — full content reviewed. It is a single `middleware(request)` function with a static `matcher` config: `'/((?!api|_next/static|_next/image|favicon.ico).*)'` (excludes API routes, static assets, image-optimizer, favicon; matches everything else). It reads one cookie, `b3_session`, and makes four decisions:

1. **Admin gate**: `pathname.startsWith('/admin')` → redirect to `/auth` unless `session === 'ADMIN'`.
2. **Doctor gate**: `pathname.startsWith('/doctor')` → redirect to `/auth` unless `session === 'DOCTOR'`.
3. **General auth gate**: a hardcoded prefix list (`/dashboard`, `/settings`, `/checkout`, `/clinic-booking`, `/consultation`, `/health-assessment`, `/rate-us`, `/learn/`, `/read/`, `/community/chat`, `/community/researches`, `/monograph`) → redirect to `/auth` if no `session` cookie at all.
4. **Reverse gate**: if already on `/auth` with a session cookie present, redirect to the role's home (`/admin/users`, `/doctor`, or `/dashboard`).

```
Issue:            src/middleware.ts uses the file convention deprecated in Next 16 in favor of proxy.ts.
Location:         src/middleware.ts:1 (whole file)
Severity:         P2
Why it matters:   Confirmed both by context7 (v16.2.9 docs) and by the project's own build output: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` It still works (Next 16 keeps it functional this cycle) but is on a deprecation path; the production build labels it `ƒ Proxy (Middleware)` internally already.
Current behavior: File is named middleware.ts, exports function middleware(request).
Recommended solution: Run `npx @next/codemod@canary middleware-to-proxy .` (renames file to proxy.ts and the export to proxy) — no runtime behavior change since this middleware doesn't set `runtime: 'edge'` and proxy.ts always runs on nodejs, which matches current behavior.
Risk:             Low — purely a rename + function name codemod; re-verify the matcher and cookie logic still evaluate identically after.
Verification method: `npm run build` and confirm the deprecation warning is gone; hit an /admin route unauthenticated and confirm the redirect still fires.
Status:           Open
```

```
Issue:            Auth/role gating in middleware trusts a plaintext, unsigned cookie value ('ADMIN' / 'DOCTOR' / any truthy value) with no verification.
Location:         src/middleware.ts:7-9, 13-15, 30-33
Severity:         P1
Why it matters:   `request.cookies.get('b3_session')?.value` is compared with `===` to literal role strings. Cookies are client-writable unless marked httpOnly+signed and verified server-side; nothing in this file verifies a signature/JWT — it's a direct equality check on whatever value the cookie holds. This is an authorization decision made entirely client-observable if the cookie isn't httpOnly/signed elsewhere in the auth flow (not in scope to verify here — the auth-setting code lives in src/features/auth/, outside this audit's file list, but the middleware itself contains no verification step regardless of how the cookie is set).
Current behavior: if (!session || session !== 'ADMIN') { redirect }.
Recommended solution: Verify a signed session token (e.g. decode/verify a JWT, or check against a session store) rather than comparing a raw cookie value to a role string.
Risk:             Requires coordinating with however src/features/auth/ issues the cookie today — flagging for follow-up, not fixing here (read-only audit).
Verification method: Attempt to set document.cookie = 'b3_session=ADMIN' from devtools on a non-admin session and see whether /admin becomes reachable.
Status:           Open
```

---

## 6. Caching & rendering

Real route data from `npm run build` (Turbopack, Next 16.2.9, exit 0):

- **Static (`○`)**: the large majority of routes, including nearly all `(account)/dashboard/*` pages, all top-level `(site)` pages except detail routes, `(admin)` list pages, `/auth`, `/community/*` index pages. This holds even though most of these `page.tsx` are `'use client'` (§1) — a client-component page with no dynamic API access can still be prerendered to static HTML and hydrated; `'use client'` alone does not force `ƒ`.
- **Dynamic (`ƒ`)**: every `[param]` route with no `generateStaticParams` (confirmed: `grep -rl generateStaticParams src/app` → 0 matches anywhere), e.g. `/courses/[courseId]`, `/books/[bookId]`, `/encyclopedia/[entryId]`, `/monograph/[monographId]`, `/clinic/[clinicId]`, all `/admin/*/[id]/edit` routes, plus `/api/ai/chat` and the `/checkout/[type]/[id]/[[...format]]` catch-all.

No route in `src/app` exports `dynamic`, `revalidate`, `fetchCache`, or `runtime` (`grep -rn "export const dynamic\|revalidate\|fetchCache\|runtime" src/app` → 0 matches), and no page calls `cookies()` or `headers()` (0 matches). So every `ƒ` route is dynamic purely because it's a param route with no static param enumeration — not because of an explicit opt-out or a request-scoped API read.

```
Issue:            Content catalog detail routes (courses, books, encyclopedia entries, monographs) are fully server-dynamic with no generateStaticParams, despite being publicly cacheable catalog content.
Location:         src/app/(site)/courses/[courseId]/page.tsx, src/app/(site)/books/[bookId]/page.tsx, src/app/(library)/encyclopedia/[entryId]/page.tsx, src/app/(library)/monograph/[monographId]/page.tsx — confirmed ƒ in build output, 0 generateStaticParams anywhere
Severity:         P2
Why it matters:   These are the same pages flagged in §4 as highest-value SEO targets. Right now they're server-rendered per request with no static shell and no revalidate window, which is slower to first byte and offers no CDN cacheability, on top of shipping no per-page metadata.
Current behavior: Default dynamic rendering (Next's fallback for an unenumerated [param] route).
Recommended solution: Once params are read server-side (§1) and metadata is added (§4), add generateStaticParams for known catalog IDs plus `export const revalidate = <n>` (ISR) so catalog pages are cached and periodically refreshed instead of rendered on every request.
Risk:             Needs the catalog data source to support server-side enumeration (out of scope — data fetching is covered by the parallel audit).
Verification method: After adding, build output should show these routes flip from ƒ to ● (SSG) or stay ƒ but with a revalidate window visible in the prerender manifest.
Status:           Open
```

No accidental over-caching risk was found: since Next 15/16 `fetch` is uncached by default (confirmed via context7, §"Next 16 version notes"), and `cacheComponents`/`use cache` is not enabled in `next.config.ts`, there's no stale-data risk from caching config in this codebase — the only rendering-cost issue is the reverse one (unnecessary dynamic rendering on cacheable content, above).

---

## 7. Images & fonts

**Raw `<img>`**: `grep -rn "<img" src --include="*.tsx" | wc -l` → **26 occurrences** (corroborates the parallel audit's count of 26). One is inside a test string literal (`src/components/ui/rich-text.test.tsx:15`, not a real rendered element); the remaining 25 are live JSX. `grep -rl "from 'next/image'" src` → **0 files** — `next/image` is never imported anywhere in `src/`.

```
Issue:            25 live raw <img> tags across 19 files; next/image is used nowhere in the codebase (0 imports).
Location:         src/features/library/components/encyclopedia-list.tsx (4), src/features/clinic/components/clinic-detail-page.tsx (2), src/features/clinic/components/clinic-page.tsx (2), src/features/library/components/encyclopedia-detail.tsx (2), and 15 more single-occurrence files including src/features/books/ui/BookCard.tsx:19, src/features/site-content/components/home-page.tsx:106 (the homepage logo), src/features/courses/ui/CourseCard.tsx:13, src/features/trips/components/trip-detail-page.tsx:95
Severity:         P1
Why it matters:   No automatic responsive srcset, no format negotiation (AVIF/WebP), no lazy-loading-by-default, no CLS protection from layout-reserved dimensions — for image-heavy list/card/detail views (courses, books, clinics, encyclopedia, trips) across the whole product. next.config.ts already configures 4 remotePatterns hosts (picsum.photos, images.unsplash.com, raiyansoft.com, nader32.com), so next/image is set up but unused — this is pure upside left on the table, not a migration blocker.
Current behavior: <img src={...} alt={...} className="..." /> with manual Tailwind sizing classes (e.g. h-44 w-full object-cover), no width/height attributes.
Recommended solution: Swap to next/image on the highest-traffic card/list components first (BookCard, CourseCard, encyclopedia-list — these render N-per-page). Since containers use fixed/aspect Tailwind classes already, `fill` + `sizes` is the natural fit; note Next 16 deprecated `priority` in favor of `preload` (confirmed via context7) — use `preload` for the above-the-fold homepage logo (home-page.tsx:106).
Risk:             Requires each image's remote host to already be in remotePatterns (4 are; verify each <img> src's host is covered before swapping — e.g. book.coverImage / doctor.avatar / clinic.image source hosts weren't checked here, out of scope for a read-only pass).
Verification method: After swap, confirm no next/image "hostname not configured" runtime error and run a Lighthouse CLS check.
Status:           Open
```

**Fonts**: `src/app/layout.tsx` uses `next/font/google` (`Alexandria`, `subsets: ['arabic','latin']`, `display: 'swap'`, exposed as a CSS variable). `src/app/globals.css` has no `@font-face` and no font `<link>`/`@import` — fonts are 100% via `next/font`, which self-hosts and eliminates render-blocking font requests. **This is clean** — no CLS-from-fonts risk; nothing to flag.

---

## 8. Navigation

`grep -rl "from 'next/link'" src` → **63 files** use `next/link` directly. `src/lib/routing/next-router-compat.tsx` additionally wraps `next/link` behind a React-Router-shaped `Link` (`to` or `href` prop) used in 14 files (§1) — functionally still `next/link` under the hood, so client-side navigation is preserved even through the shim; this is not a broken-navigation finding, just the same architectural shim flagged in §1.

```
Issue:            4 raw <a href="/..."> internal links bypass next/link, forcing a full page reload.
Location:         src/features/auth/components/auth-page.tsx:236, :238, :243, :245 (links to /terms and /privacy, in Arabic and English UI branches)
Severity:         P3
Why it matters:   Full page reload instead of client-side transition on a low-traffic, non-critical link (terms/privacy from the auth screen); minor UX cost, not a correctness bug.
Current behavior: <a href="/terms" target="_blank" rel="noopener noreferrer">...</a> (also note target="_blank" — opening in a new tab is arguably intentional here, in which case next/link with target="_blank" is a drop-in replacement).
Recommended solution: Replace with next/link (Link href="/terms" target="_blank") for consistency; low priority given target="_blank" already limits the reload's visible cost.
Risk:             None.
Verification method: Click-through smoke test.
Status:           Open
```

`src/lib/routing/routes.ts` is a plain object of path builders (`routes.courseDetail(id)`, `routes.checkout(type, id, format)`, etc.) — a small, consistently-typed helper. It is **not used everywhere**: many components build paths with inline template literals (e.g. `/encyclopedia/${latestNews[0].id}` in `encyclopedia-list.tsx:87`) instead of calling `routes.*`, even though equivalent builders don't all exist in `routes.ts` for every entity (e.g. no `routes.encyclopediaEntry`). This is a minor consistency gap, not scored as its own finding — the helper itself is clean, adoption is partial.

---

## 9. Route handler — `src/app/api/ai/chat/route.ts`

Full file (11 lines):

```ts
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      text:
        'B3 Assistant is keyword-based in this frontend build. Please use the on-page assistant widget for configured keyword answers.',
    },
    { status: 200 },
  );
}
```

- **Runtime**: no `export const runtime` — defaults to Node.js. No streaming (single `NextResponse.json`, no `ReadableStream`/SSE). **No request body is read at all** — the handler ignores whatever the client posts. **No validation** (nothing to validate — the body is never parsed). **No error handling** — nothing can throw; it's a static canned response.
- **`@google/genai` server-side-only check**: **moot** — `@google/genai` (`^1.50.1`, present in `package.json`) is **not imported anywhere in `src/`** (`grep -rn "genai\|GoogleGenAI" src` → 0 matches). The actual AI-chat UI (`src/features/ai-assistant/components/ai-chat-widget.tsx`) calls `resolveAssistantReply()` from `src/features/ai-assistant/services/assistant-config.service.ts` directly in the browser — a keyword/config-table lookup, not an LLM call — and never hits this route handler at all (the widget doesn't `fetch('/api/ai/chat')`).

```
Issue:            @google/genai is a dependency (package.json) but is dead code — never imported anywhere in src/ — and the /api/ai/chat route handler that would presumably wrap it is an unused stub returning a hardcoded string.
Location:         package.json:17 (dependency); src/app/api/ai/chat/route.ts:1-11 (stub handler, not called by the client); src/features/ai-assistant/components/ai-chat-widget.tsx:74 (actual widget calls resolveAssistantReply() locally, bypassing the route entirely)
Severity:         P2
Why it matters:   Not a security issue (there's no genai client to leak, server-side or otherwise — the "server-side only" question in the brief is moot because it doesn't exist in code), but it's dead weight: an unused ~heavy SDK dependency inflating install size and node_modules, and a route handler that looks like a real AI backend but is a placeholder. Anyone reading route.ts or ai-chat-widget.tsx in isolation would reasonably assume an LLM is wired up; it is not.
Current behavior: POST /api/ai/chat always returns the same static "keyword-based" disclaimer string regardless of request body; the client never actually calls it.
Recommended solution: Either remove @google/genai from package.json (and delete/repurpose the stub route) if the keyword-based assistant is the permanent design, or implement the real integration behind this route handler (with runtime='nodejs', streaming via ReadableStream/SSE, zod-validated request body, try/catch error handling) and instantiate the GoogleGenAI client only inside the route handler (never in a 'use client' file) when that work happens.
Risk:             None to remove; confirm with product/eng whether genai integration is planned before deleting the dependency.
Verification method: `grep -rn "genai" src` stays empty after cleanup; `npm ls @google/genai` removed from the tree.
Status:           Open
```

---

## 10. Bundle & dynamic imports

`grep -rl "next/dynamic" src` → **0 files**. `next/dynamic` is never used anywhere — no component in the app is code-split beyond Next's automatic per-route splitting.

Heavy-dependency usage, checked individually:
- **`jspdf`**: `grep -rn "from 'jspdf'" src` → 0 matches. Installed, unused. Dead dependency.
- **`react-markdown`**: `grep -rn "react-markdown" src` → 0 matches. Installed, unused. Dead dependency.
- **`@google/genai`**: unused — covered in §9.
- **`isomorphic-dompurify`**: used in exactly 1 file, `src/components/ui/rich-text.tsx:1`, inside `RichText` (not itself `'use client'` — it's a plain function component that runs `DOMPurify.sanitize()` at render time and returns `dangerouslySetInnerHTML`). Its callers determine whether it ships client-side; not checked exhaustively here, but it's a single, contained usage — low bundle risk either way since isomorphic-dompurify is already designed to be lean.
- **`motion` (`motion/react`)**: used in **8 files**, including `src/features/ai-assistant/components/ai-chat-widget.tsx`. That widget is rendered unconditionally inside `Providers` (`src/app/providers.tsx:29`), which wraps **every page in the app** via the root layout. Since `Providers` and everything it renders is `'use client'`, `motion` (a non-trivial animation library) is pulled into the client bundle shipped to **every route**, not just the pages that show the chat widget.
- **`cmdk`**: used in exactly 1 file, `src/components/ui/command.tsx` ("use client", imports `Command as CommandPrimitive from 'cmdk'`), which is in turn imported by exactly 1 consumer: `src/components/ui/phone-input.tsx` (a country-search combobox for phone number entry). Contained, appropriately client-only, no fix needed.

```
Issue:            AIChatWidget (which pulls in the `motion` animation library) renders unconditionally from the root Providers tree, shipping it in every route's client bundle even though it's a below-the-fold, closed-by-default floating widget.
Location:         src/app/providers.tsx:29 (<AIChatWidget /> inside Providers, rendered from root layout for every page); src/features/ai-assistant/components/ai-chat-widget.tsx:3 (imports motion/react)
Severity:         P2
Why it matters:   motion ships to every single route's initial client JS regardless of whether the visitor ever opens the chat widget (it starts closed — isOpen defaults to false, ai-chat-widget.tsx:24). This is the one clear, evidence-based next/dynamic opportunity in the codebase (0 next/dynamic usage anywhere today).
Current behavior: Eagerly imported and rendered in Providers, part of every page's initial bundle.
Recommended solution: `const AIChatWidget = dynamic(() => import('...ai-chat-widget').then(m => m.AIChatWidget), { ssr: false })` in providers.tsx — defers loading motion and the widget's code until after initial hydration (or until first interaction, with a slightly more involved lazy-mount pattern).
Risk:             Low — widget already renders nothing meaningful before user interaction; ssr:false is safe since it's a floating fixed-position overlay with no SEO value.
Verification method: Compare the shared/first-load JS size in the build output before/after (`npm run build` route table) for a representative static route.
Status:           Open
```

```
Issue:            jspdf, react-markdown, and @google/genai are installed dependencies with zero usage anywhere in src/.
Location:         package.json:17,30,39 (dependencies); confirmed via grep across src for each package's import specifier — 0 matches for all three
Severity:         P3
Why it matters:   Inflates node_modules / install time and lockfile surface for code that ships nothing. jspdf in particular is a large library; carrying it unused is pure cost.
Current behavior: Present in package.json dependencies, never imported.
Recommended solution: Remove from package.json if genuinely unused (double-check no dynamic/string-based import exists first — none was found), or wire them up if features (PDF export, markdown rendering) are planned but incomplete.
Risk:             None to remove if truly dead; confirm with the team before deleting in case of near-term planned use.
Verification method: `npm uninstall jspdf react-markdown @google/genai` (after confirming), then `npm run build` still succeeds.
Status:           Open
```

No `.next/` route-size table was needed beyond what's quoted in §6/§9/§10 — the `npm run build` output (Turbopack, 68 static pages generated, full ○/ƒ route table) was captured directly rather than inferred.

---

## Summary of open findings by severity

- **P0**: none found. (§3: no sync-params bug exists, because no page reads the server `params` prop at all — see explanation in §3.)
- **P1** (6): unnecessary/root-cause client boundary architecture (§1, next-router-compat shim); leaf components with pointless `'use client'` (§1, BookCard/AdminPageHeader); no `error.tsx` anywhere (§2); 0/94 pages have per-page metadata (§4); unsigned/unverified session-cookie role check in middleware (§5); 25 raw `<img>` with `next/image` unused everywhere (§7).
- **P2** (6): 27 dead `'use client'` service files (§1); no `loading.tsx` anywhere (§2); no `sitemap.ts`/`robots.ts` (§4); catalog detail routes fully dynamic with no `generateStaticParams`/ISR (§6); `middleware.ts` deprecated file convention (§5); `@google/genai` dependency + stub route are dead/misleading (§9); `AIChatWidget`/`motion` eagerly bundled into every route (§10).
- **P3** (2): 4 raw `<a href="/...">` in auth-page.tsx (§8); `jspdf`/`react-markdown`/`@google/genai` unused dependencies (§10).
