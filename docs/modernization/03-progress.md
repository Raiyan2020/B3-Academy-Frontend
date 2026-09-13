# 03 — Progress

Running log. Verification results are recorded as measured, including failures.

## Verification history

| Point in time | Typecheck | Lint | Tests | Build |
| --- | --- | --- | --- | --- |
| Baseline (pre-change) | 0 errors | **FAIL** — 18,380 problems (1,845 err) | 59/59 | exit 0 |
| After Batch 1 | 0 errors | **exit 0** — 0 problems | 59/59 | exit 0 |
| After Batches 2, 4a, 5a, 6, 7 | 0 errors | exit 0 | **68/68** | exit 0 |
| After Batch 8a (Skill-derived perf) | 0 errors | exit 0 (with `purity` now `error`) | 68/68 | exit 0 |
| After Batch 8b (RACE-001 language fix) | 0 errors | exit 0 | **75/75** (23 files) | exit 0 |

Security: `npm audit` **12 vulnerabilities (10 high) → 0**.
Dependencies: 22 runtime deps, down from 28. 134 packages removed from the tree.

---

## Batch 1 — Tooling, gates, and free wins ✅ COMPLETE

Every item verified before being checked off.

**Environment**
- `node_modules` was absent at baseline; `npm install` → exit 0.
- Measured and recorded the full baseline in `00-project-baseline.md` before touching
  any code, so nothing here can be misattributed.

**Agent tooling**
- `.mcp.json` created: `context7` (HTTP transport, key via `${CONTEXT7_API_KEY}`) and
  `shadcn` (mirroring the project's existing `.cursor/mcp.json` choice).
- Key stored in `.claude/settings.local.json`, added to `.gitignore`, and **verified
  invisible to git** via `git check-ignore -v` plus a tracked/untracked search for the
  literal token. Takes effect next session (MCP servers load at startup).

**The lint gate — the headline measurement correction**
- Added `backend/**` to `globalIgnores`. `npm run lint` went from **18,380 problems
  (1,845 errors) to 3**, then to **0** after fixing the three real warnings.
- All 1,845 errors originated in `./backend/`, an unrelated Laravel app that is already
  git-ignored but which ESLint's flat config walked into regardless. The frontend was
  never in that state — see D2 in `04-decisions.md`.
- The three genuine `react-hooks/exhaustive-deps` warnings were fixed properly, not
  suppressed:
  - `src/features/consultations/components/booking-slot-selector.tsx:31` — wrapped
    `filters` in `useMemo` and depended on it in both downstream `useMemo`s.
    Behaviour-preserving.
  - `src/features/consultations/components/chat-consultation.tsx:44` — memoized
    `messages`, which previously got a new array identity every render and made the
    scroll-to-bottom effect fire on every render instead of on new messages. A real
    small behaviour fix. Added `useMemo` to the React import.
- `npm run lint` is now a usable gate for the first time.

**Security**
- `npm audit fix` → **0 vulnerabilities** (from 10 high + 2 moderate in transitive
  `undici` and `ws`).
- Side effect accepted and verified: `next` 16.2.9 → 16.3.4, `react`/`react-dom`
  19.2.1 → 19.2.5. Both within the existing caret ranges, so `package.json` is
  unchanged. Full suite re-run green afterwards. Reasoning and rollback instructions in
  D4.

**Dependencies**
- Removed 6 unused: `@google/genai`, `jspdf`, `react-markdown`,
  `@radix-ui/react-{dialog,dropdown-menu,tabs}`. 134 packages removed.
- Confirmed zero importers with quote-agnostic ripgrep + an explicit dynamic-`import()`
  check + a passing build. An earlier single-quoted grep of mine wrongly flagged
  `radix-ui` itself as unused — caught and corrected before acting. See D5.

**TypeScript**
- Enabled the five strict flags measured at 0 errors each: `strictFunctionTypes`,
  `strictBindCallApply`, `noImplicitThis`, `useUnknownInCatchVariables`,
  `alwaysStrict`. Typecheck still 0 errors.
- `strictNullChecks` (26) and `noImplicitAny` (12) deferred to Batch 3, intentionally
  sequenced after zod lands at the API boundary. See D6.

**Next.js convention**
- `src/middleware.ts` → `src/proxy.ts`, `export function middleware` → `export function
  proxy`. Confirmed via the build's own deprecation warning **and** Context7 docs
  before renaming. Build warning gone; `ƒ Proxy (Middleware)` still present in build
  output, so the route gating is still wired.

**Repo hygiene**
- `tsconfig.tsbuildinfo` untracked and gitignored (machine-specific build artifact).
- `.env` deliberately left tracked — it holds only the public API URL and is
  byte-identical to `.env.example`, so nothing is exposed, and untracking it would
  delete it from other contributors' working trees. Recorded as a team-coordination
  recommendation instead. See D9.

---

## Batch 2 — React correctness (P0) ✅ COMPLETE

- [x] **P0 Rules-of-Hooks** (`settings-page.tsx`) — all 20+ hooks now run
      unconditionally; initial state derives null-safely (`user?.name ?? ''`); the
      `navigate('/auth')` moved out of the render body into a `useEffect`; the bare
      `if (!user) return null` now sits *after* every hook, so it conditions rendering
      only, never hook count.
- [x] **P0 podcast restore race** — root cause confirmed: `PodcastPlayerProvider` is
      nested inside `AuthProvider`, and React fires mount effects child-first, so the
      restore effect ran and ref-locked itself before auth hydrated. Fixed by adding
      an `isAuthReady` flag to `AuthContextType`/`AuthProvider`, set on every branch of
      the hydration effect; the restore effect now gates on it.
- [x] **P1 `addresses` dual source of truth** — local `useState` + sync effect removed;
      `addresses` is now `backendAddresses.data ?? []`, with all three handlers routed
      through the existing mutation hooks that already invalidate on success. The dead
      `getStoredApiToken()`-gated local-only fallback branches were removed.
- [x] **P1 unmemoized `AuthContext`** — all ~18 exposed functions wrapped in
      `useCallback` with correct deps (including the internal `afterAuth` helper, to
      stop it going stale), and the context value is now `useMemo`'d.
- [x] **`react-hooks/rules-of-hooks` re-enabled as `error`** — verified clean first with
      `npx eslint src --rule '{"react-hooks/rules-of-hooks":"error"}'`, then enabled.
      `npm run lint` still exits 0 with it enforced.
- [x] `react-hooks/set-state-in-effect` + `react-hooks/purity` measured at **15
      warnings** — left off, with the count recorded in `eslint.config.mjs` and the
      instruction not to raise `--max-warnings` to accommodate them.

**Accuracy correction on the P0 severity.** The agent noticed, and I verified, that
`settings-page.tsx` is **unreachable**: it has zero importers, and `/settings`
(`src/app/(account)/settings/page.tsx`) is a 3-line `redirect('/dashboard/profile')`.
So the Rules-of-Hooks violation was a real defect in **dead code**, not a live crash.
It was rated P0 on the assumption the component rendered. Fixing it was still correct
— it is a landmine for anyone who imports the component — but the audit's severity was
too high, and that is worth stating rather than quietly banking the win.

## Batch 4a — Accessibility primitives ✅ COMPLETE (partial batch)

Done by me directly, because the delegated agent launch was blocked twice by the
environment's permission classifier. Scoped to the shared primitives — the highest
-leverage part — with the ~28 call-site migrations still outstanding.

- [x] `Input` and `Textarea` accept an `invalid` prop mapping to `aria-invalid`, with
      an explicit `aria-invalid` passed by the caller taking precedence. Semantic only:
      no class changes, so no visual change.
- [x] New `src/components/ui/field.tsx` — a `Field` wrapper that solves all three
      wiring problems in one place: generates an id so `<Label htmlFor>` actually points
      at its control (`htmlFor` appeared **once** in the entire codebase before this),
      sets `aria-invalid` on error, and links the control to its `FormFieldError` via
      `aria-describedby`. Uses a render prop rather than cloning children, because the
      aria attributes must land on the real control — which may be `Input`, `Textarea`,
      `PhoneInput`, `PasswordInput` or a plain `<select>` — and cloning would guess wrong.
      It renders no styling of its own, so dropping it into an existing form changes no layout.
- [x] `FormFieldError` needed no change — it already had `role="alert"` and an `id`
      prop. The audit implied it was deficient; it was only **unused**. Its public props
      are untouched, so code written against it elsewhere keeps working.
- [x] 6 tests in `src/components/ui/field.test.tsx` covering label association,
      `aria-invalid`, the control actually pointing *at* the error node, the valid case
      rendering no alert, hint+error both being referenced by live ids, id uniqueness
      across instances, and an explicit `aria-invalid` winning.
- [x] **Fixed a test-infrastructure bug found while doing this:** `src/qa/test-setup.ts`
      registered no React Testing Library `cleanup`, so the DOM accumulated across `it`
      blocks within a file — which is why one existing file
      (`courses/ui/course-flows.test.tsx`) had to call `cleanup()` by hand. Added a
      global `afterEach(cleanup)`. The full suite still passes, so nothing depended on
      the accumulation.

**Outstanding from Batch 4** (not attempted): migrating the ~28 hand-rolled field
errors onto `Field`/`FormFieldError`, labelling icon-only buttons, converting
`<div onClick>` pseudo-buttons, the 4 `alt=""` thumbnails, missing
`DialogTitle`/`DialogDescription`, and the `AdminShell`/`AdminPageHeader` duplicate
`<h1>`. The primitives now exist to do all of it cheaply.

## Batch 6 — Backend API integration ✅ MOSTLY COMPLETE

The delegated agent completed the whole data layer, then hit a session rate limit
partway through UI wiring. I verified its work and finished the favorites surface.

**Data layer — done and contract-verified:**
- [x] `src/features/favorites/` — services, hooks, `query-keys.ts`, zod-validated types,
      and a shared `FavoriteToggleButton`.
- [x] `src/features/consultations/` — catalog services, hooks and types for all 6 new
      endpoints (4 public reads + 2 authenticated mutations).
- [x] **zod parsing at the API boundary** for all new endpoints — new code does not
      repeat the codebase's existing blind-cast pattern.
- [x] Response envelope verified end to end by me, not assumed: the backend returns
      `jsonResponse(data: {items, pagination})` via `PaginationTrait::paginatedData`,
      and `apiFetch` unwraps `data` (`base-fetch.ts`), so the schema matches exactly.
- [x] Mutation `meta: { successMessage }` / `{ silentSuccess }` confirmed to be real
      project conventions read by `src/lib/query/get-query-client.ts`.

**`is_favorited` surfaced on all 7 content types** — `FavoriteToggleButton` wired into
`BookDetailView`, `CourseDetailView`, `clinic-detail-page`, `trip-detail-page`,
`encyclopedia-detail` (covers both `encyclopedia_news` and `herbal_library_entry`) and
`PlantFungiDetailView`. Optimistic update with rollback on error, `aria-pressed`,
bilingual `aria-label`, `aria-hidden` icon, disabled while pending, and a guest
pending-intent path.

**Favorites list page rewritten** (`favorites-page.tsx`) — was entirely
localStorage/mock-driven, recomputing availability from local catalog data and forcing
re-renders with a `version` counter. Now uses the real `GET /favorites`, with the
backend's own `FavoriteService::resolveAccessState` output (`is_available`, `can_open`,
`requires_subscription`, `unavailable_reason`, `redirect_hint`) driving the states.
**Every Arabic string and every Tailwind class preserved**; added loading and error
states and a pending state on the remove button.

- [x] `routes.ts` extended with `clinicDetail`, `tripDetail`, `encyclopediaEntry`,
      `monographDetail` (reusing the existing helper rather than adding a parallel one).
- [x] New `favorite-routes.ts` maps favoritable type → page route. Necessary because
      the API's `item.detail_endpoint` is an **API** path (`/api/v1/user/courses/5`),
      not a page URL, so it cannot be used as an `href`.
- [x] Removed the now-superseded `src/features/account/components/favorite-button.tsx`
      (the old localStorage favorite button) — verified zero usages. Leaving it would
      have meant two favorite buttons with two different backends.

### ⚠ Not wired, and deliberately so — needs a product decision

The consultations catalog **data layer is complete but connected to no component.**
Wiring it is not a mechanical port, for a reason worth recording:

`src/features/consultations/components/booking-slot-selector.tsx` serves **three**
contexts — individual doctor consultations, clinic bookings, and trip bookings (props
`doctorId`, `clinicId`, `tripId`) — and currently reads from a local
`slot-repository.service`. But the new endpoint is doctor-scoped, and
`ConsultationAvailableSlotsRequest` restricts `type` to
`CareBookingTypeEnum::individualConsultationTypeValues()`. **It does not cover clinic or
trip slots.** Migrating the component wholesale would break clinic and trip booking.

Likewise `consultations/page.tsx`, `[doctorId]/book` and `package/[packageId]/book`
still read mock data (`CARE_DOCTORS`, `getConsultationPackageById`).

So the open question is how the new doctor-centric endpoints should coexist with the
existing clinic/trip slot model — a product/architecture decision, on a
booking/payments flow, not something to guess at. The services and hooks are ready to
consume the moment that is settled.

## Batch 7 — Dead code removal ✅ COMPLETE

10 files removed, each with its own evidence, verified in two groups with the full
suite run after each.

- [x] The 4 zero-consumer root contexts — `BlogContext.tsx`, `ResearchContext.tsx`,
      `TheoryContext.tsx`, `CourseCommentContext.tsx`. Each exported hook, provider and
      filename was grepped repo-wide in both quote styles plus dynamic `import(`; the
      only reference was `providers.tsx`. Unmounted there, keeping the remaining nesting
      order intact (provider order is load-bearing).
- [x] `components/Layout.tsx`, `components/QuizPlayer.tsx`,
      `components/HealthAssessmentForm.tsx` — zero importers; each is shadowed by a
      live, separately-implemented `src/features/**` counterpart.
- [x] `components/AIChatWidget.tsx` and `services/geminiService.ts` — both turned out to
      be **dead re-export shims** with zero importers. The live
      `src/features/ai-assistant/components/ai-chat-widget.tsx` was correctly left
      alone; `providers.tsx` imports the feature path directly, not the shim.
- [x] `src/app/api/` (the `/api/ai/chat` stub) — deleted by me after independently
      confirming zero references anywhere in `src/`, and that the real assistant does
      purely local keyword lookup with no fetch. Its `@google/genai` dependency was
      already gone. Required clearing `.next` afterwards, because Next's generated route
      validators still referenced the deleted file and made `tsc` fail spuriously.

**tsconfig `include` cannot be narrowed to `src/**`** — the remaining root files
(`LanguageContext.tsx`, `CurrencyContext.tsx`, `types.ts`, `data.ts`,
`components/UI.tsx`, `components/Graphics.tsx`) are still load-bearing, as are
`next.config.ts` and `vitest.config.ts`.

## Batches 3, 5b, 8 — NOT STARTED

## Batch 5a — Error boundaries & SEO files ✅ COMPLETE

19 new files, all additive — no existing component was modified.

- [x] `error.tsx` in all 9 route groups: `(site)`, `(account)`, `(auth)`, `(checkout)`,
      `(community)`, `(learn)`, `(library)`, `(admin)`, `(doctor)`. The app previously
      had **zero** error boundaries, so any render error took down the whole tree with
      no recovery path.
- [x] `src/app/global-error.tsx` — catches root-layout failures. Correctly defines its
      own `<html>`/`<body>` and imports `globals.css`, because it *replaces* the root
      layout rather than nesting inside it. Uses English text and mirrors the existing
      root `not-found.tsx`, since it renders outside `LanguageProvider` and cannot call
      `useLanguage()`.
- [x] `loading.tsx` in the six data-fetching groups: `(site)`, `(account)`, `(admin)`,
      `(doctor)`, `(community)`, `(library)`.
- [x] `src/app/sitemap.ts` and `src/app/robots.ts`. Both resolve as static routes in the
      build output (`/sitemap.xml`, `/robots.txt`). Sitemap enumerates real static routes
      read from the route tree; bracket-segment detail routes are excluded with a comment
      explaining they need backend data to enumerate. Robots disallows `/admin`,
      `/doctor`, `/dashboard`, `/settings`, `/checkout`, `/api`.
- [x] `src/lib/site-url.ts` — `getSiteUrl()` reading `NEXT_PUBLIC_SITE_URL` with a
      fallback, since the only pre-existing env var points at the *API*, not the site.
- [x] `NEXT_PUBLIC_SITE_URL` added to `.env.example` (done by me — the agent was
      correctly barred from touching env files).
- [x] Verified: typecheck 0 errors · `npx eslint src` clean · 59/59 tests · build passes
      with all 70 routes resolving.

**Reuse over invention, worth noting:** rather than writing new error/loading UI, the
agent found and used `RetryPanel` and `LoadingState`, which already existed in
`src/components/feedback/feedback.tsx` and had **no consumers until now**. They were
evidently built for exactly this and never wired up. Bilingual strings follow the
established `useLanguage()` + ternary pattern.

Convention correctness was confirmed against Context7's Next.js docs before writing
(the `error.tsx` prop contract and its `'use client'` requirement, `global-error.tsx`
replacing the root layout, and the `MetadataRoute.Sitemap` / `MetadataRoute.Robots`
shapes) rather than written from memory.

## Batch 6 — Backend API integration 🔄 IN PROGRESS

Delegated. Wiring the 9 new endpoints from `backend-api-delta.md`: favorites
(list/toggle/delete), the 4 public consultations-catalog reads, and the 2 authenticated
booking endpoints — plus surfacing the new additive `is_favorited` field on the 7 detail
endpoints with optimistic toggling.

**Path convention verified by me and passed to the agent:** the real backend prefix is
`/api/v1/user/...` (confirmed in `backend/routes/api.php`), but existing frontend
services call `/api/user/...` — and that is *correct*, not a bug, because
`normalizeApiPath()` in `src/lib/api/base-fetch.ts:25-32` rewrites it. Both forms
resolve identically. Flagged so the agent neither "fixes" working paths nor mixes styles.

## Batches 3, 4, 5b, 7, 8 — NOT STARTED

See `02-plan.md`.

## Batch 9 — POSTPONED by decision

The session-model fix and the router-shim retirement. Both documented in D10. The
session fix is blocked on a backend change and is a coordinated decision, not a
unilateral frontend edit.

---

## Batch 8a — Performance fixes derived from the Vercel React Skill

Run after the `vercel-react-best-practices` Skill audit (see D11 for why it ran late).
Both changes went through the full loop individually; nothing here was checked off on the
strength of a build alone.

### `AIChatWidget` off the critical path — the P0

**Before (measured by the audit agent):** the widget's chunk was **54,355 bytes** and
shipped to all 94 routes, because it was statically imported and unconditionally mounted
in `src/app/providers.tsx` under the single root layout. Its own `isAssistantEnabled()`
check sits *after* its hooks, so the flag could only hide the UI, never avoid the download.

**Change:** replaced the static import with `next/dynamic` + `ssr: false` (the widget is
client-only regardless — it reads `localStorage`).

**Verification — measured, not assumed.** A clean `rm -rf .next && npm run build`, then the
widget's marker strings were located and each candidate chunk's reach counted against the
98 per-route client-reference manifests:

| Chunk | Size | Server-route refs | Contains |
| --- | --- | --- | --- |
| `24_wf6sluuc4a.js` | 16,181 B | **0** | `AIChatWidget`, `bottom-24`, `isAssistantEnabled` |
| `324hgvjp8f82r.js` | 34,686 B | 95 | only the `dynamic()` stub |

The stub is all that remains in the shared chunk:

```js
(0,n.default)(()=>e.A(3202).then(e=>({default:e.AIChatWidget})),{ssr:!1})
```

`bottom-24`, `isAssistantEnabled` and the widget body appear in **neither** the 95-route
chunk nor any other route-referenced chunk — they are only in the 0-reference on-demand
chunk. That is the finding's own stated verification method, satisfied.

Gates: typecheck 0 errors · `npm run lint` exit 0 · 68/68 tests · build exit 0.

### API `preconnect` — the P1

~90 of 94 pages fetch from the API origin on mount, and because the app is almost entirely
client-rendered those fetches cannot start until after hydration, so the TCP+TLS handshake
was paid serially on the critical path of the first real request.

Three judgment calls worth recording:

- **Derived, not hardcoded.** The origin comes from a new `getApiOrigin()` in
  `base-fetch.ts`, reading the same `NEXT_PUBLIC_API_BASE_URL` the fetch layer uses. A
  literal `https://portal.b3.raiyan.cc` would have been wrong in every other environment.
- **It cannot throw.** `getApiOrigin()` returns `undefined` for a relative or malformed
  base URL rather than letting `new URL()` throw. The caller is the *root layout* — a throw
  there takes down every route to save one round trip.
- **Plain `<link>`, not `react-dom`'s `preconnect()`.** The Skill suggests the React DOM
  helper, but `@types/react-dom` is not installed in this project, and adding a dependency
  for one connection hint is not a trade worth making when React 19 hoists a plain `<link>`
  into `<head>` identically. `crossOrigin="anonymous"` was chosen to match how `apiFetch`
  actually requests (`credentials: 'omit'` + a bearer header) — a mismatched credentials
  mode opens a *second* connection and wastes the hint entirely.

**Verification.** Parsed all 67 prerendered HTML files and checked the tag's index against
`<body>`'s: present inside `<head>` in **66**. The single miss is `_global-error.html`,
which replaces the root layout by design and therefore has none of its output — expected,
not a defect. Rendered tag:

```html
<link rel="preconnect" href="https://portal.b3.raiyan.cc" crossorigin="anonymous"/>
```

### ESLint: `react-hooks/purity` turned on

The audit's warning count (16) contradicted the figure I had written into
`eslint.config.mjs` (15). Re-measured; the audit was right. The split also showed `purity`
at **zero** violations, so it had been disabled for no reason — now `'error'`, with the full
`npm run lint` gate still exiting 0. Recorded as a self-correction in **D13**.

---

## Batch 8b — RACE-001, found by the visual regression

The Phase 6 run left exactly one unexplained frame. Chasing it down produced the most
valuable single finding of this batch, and it was not visible in any static read of the
code.

**What the harness saw.** `/books` differed reproducibly and in one direction across every
run, unlike the three frames that flipped (those were backend 500s rendering a toast).

**Four wrong answers, discarded on evidence.** Recorded because each was plausible and
being disciplined about them is what led to the real cause:

1. Backend flakiness — ruled out: `/books` never flipped.
2. The Next.js version gap. Real (baseline resolved **16.2.9**, current **16.3.4**, both
   declaring `^16.2.9`) and `/books` is the only route using server `prefetchQuery` +
   `HydrationBoundary` — so a hydration-timing change was a good hypothesis. Next 16.3.4 was
   installed into the baseline worktree, code untouched, and rebuilt: **difference persisted**.
3. Build-time data drift, since `/books` is `○ (Static)`. A from-scratch baseline rebuild
   **still** prerendered English.
4. The books code changed in this pass — its only functional edit serves the detail page.

**The real cause.** DOM comparison: identical structure, titles English vs Arabic. Both
builds prerender English, so it happens after hydration. Request headers, 3/3 runs each:

| Build | `b3_lang` | `Accept-Language` | Titles |
| --- | --- | --- | --- |
| baseline | `ar` | (none), (none) | English |
| current | `ar` | ar, ar | Arabic |

`LanguageProvider` writes the language key in a mount effect; React runs effects child-first;
a page's fetches could go out first; `getStoredLanguage()` returned `undefined` and the
header was dropped. The dynamic import and memoised providers flipped the race.

**Fix + verification.** Fall back to the app default instead of `undefined`, read through
`STORAGE_KEYS.language` instead of a duplicated `'b3_lang'` literal. 4 new tests.

The regression test was itself verified: with the fix temporarily reverted it fails with
`expected null to be 'ar'` and **only** that test fails — the other six stay green. A test
that passes with and without the fix would have been worthless.

Gates: typecheck 0 · lint exit 0 · **75/75** (up from 68) · build exit 0 · browser-confirmed
`Accept-Language: ar` on 3/3 runs.

### A measurement hazard worth recording

Midway through this investigation the harness reported `/books` rendering a lunch-box
e-commerce store. Port **3000 was occupied by an unrelated project** (its own backend on
:8000), so `next start -p 3000` exited with `EADDRINUSE` and the probe silently measured
someone else's app. The tell was the `preconnect` probe: it read `false` on a build that
always emits it.

The earlier 195-frame run was **not** affected — its `preconnect` check read `true`, and a
wrong app would have made nearly all 195 frames differ rather than 3. The harness now takes
ports as arguments, and every run asserts build identity via `preconnect` before trusting a
single number.

---

## Batch 3 — `strict: true`

**Done.** Reached in the measured stages D6 laid out, so each flag's errors could be fixed
and verified on their own rather than as one 38-error pile:

| Stage | Errors | Outcome |
| --- | --- | --- |
| The 5 zero-cost flags (already on from Batch 1) | 0 | — |
| `strictNullChecks` | 27 | fixed |
| `noImplicitAny` | 12 | fixed |
| `"strict": true` | 0 | the individually-listed flags removed as redundant |

Notable fixes: 11 of the 27 `strictNullChecks` errors in `checkout-page.tsx` collapsed to a
single `if (!user) return;` guard in `confirmPayment` — the errors were the type system
correctly pointing out that the payment continuation runs on a timer, so the user can sign
out in the gap. `care-records-storage.service.ts` and `newsletter-storage.service.ts` gained
explicit return types, because TypeScript's control-flow analysis does not track assignments
made inside a callback and had inferred `null`.

`@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` were both
re-enabled as `'error'` afterwards: 20 `any` sites (mostly untyped backend-JSON mapper
boundaries) were replaced with real DTO types or a checked `unknown`-narrowing helper, and
27 unused bindings deleted.

Gates: typecheck 0 · lint exit 0 · 75/75 · build exit 0.

### Correction — two non-null assertions *were* added, and are now gone

My working note at the time said this batch was completed with no added non-null assertions.
That was wrong, and the two that slipped in were in the worst possible place — the checkout
price path:

```ts
: item.prices![format!];          // `prices` is optional on CheckoutItem
const fullPrice = Math.max(0, basePrice! - discount);
```

`format!` was pre-existing. `item.prices!` and `basePrice!` were not: they were added to
satisfy `strictNullChecks`, which is exactly the failure mode the flag exists to prevent.
Had `price` ever been absent, `Math.max(0, undefined - discount)` evaluates to `NaN`, which
renders as a broken total *and* flows into the payment intent — a silent money bug that the
type checker had correctly flagged and the assertion silenced.

Both are now removed. `basePrice` is resolved to `number | undefined` honestly
(`format ? item.prices?.[format] : undefined`) and an unresolvable price takes an early
return rendering the same "unavailable" message the neighbouring `bookFormatUnavailable`
branch already uses. Verified no hooks run after that point, so the early return does not
violate `rules-of-hooks`. A scan of the full diff confirms there are now **zero** added
non-null assertions anywhere in `src/`.

---

## Batch 5b — `<img>` → `next/image`, and `<a>` → `<Link>`

**Done.** 22 of 25 raw `<img>` elements migrated to `next/image`, using `fill` + `sizes`
inside a `relative` parent where the element was responsive, and explicit `width`/`height`
where the rendered box is fixed (avatars, logos, the podcast player thumbnail). Added
`{ protocol: 'https', hostname: 'portal.b3.raiyan.cc' }` to `images.remotePatterns` in
`next.config.ts` — the API host that serves uploaded media. All four `<a>` tags in
`auth-page.tsx` became `<Link>` (both targets, `/terms` and `/privacy`, are internal;
`target="_blank" rel="noopener noreferrer"` preserved verbatim).

**3 deliberately left as `<img>`, each for a stated reason:**

| File | Why it must stay |
| --- | --- |
| `src/components/ui/image-upload.tsx` | Previews an arbitrary user-selected source, including `data:` URLs. There is no host to allowlist, and `next/image` cannot optimize what it cannot fetch. |
| `src/features/books/ui/BookDetailView.tsx` | `w-56` with auto height — the rendered box depends on each book's own aspect ratio, which is not known ahead of time. Supplying a guessed `height` would visibly distort covers. |
| `src/features/site-content/components/home-page.tsx` | `h-40 md:h-56` with auto width, sourced from `raiyansoft.com`. The intrinsic size could not be verified — the host blocked the fetch used to check it — so any `width` would be a guess. |

`@next/next/no-img-element` therefore stays `'off'`, with those three exceptions recorded in
`eslint.config.mjs` and a re-measure command in the comment. Turning it on today would
require suppressing it in three places, which is the same information expressed worse.

Gates: typecheck 0 · lint exit 0 · 75/75 · build exit 0.

---

## Batch 4 — Accessibility

**Done.** The work was attribute-level by design: every change here is semantic, and a
screenshot before and after is identical.

- **Field errors.** 8 files had per-field validation messages with no programmatic link to
  their control. Each now has a real `htmlFor` ↔ `id` pair, `aria-invalid` on the control,
  `aria-describedby` pointing at the message, and `role="alert"` on the message itself:
  `auth-page.tsx` (confirm-password and OTP, in both the register and reset flows),
  `profile-page.tsx`, `password-page.tsx`, `security-page.tsx`, `newsletter-page.tsx`,
  `checkout-page.tsx` (coupon), `admin-user-new-page.tsx`, `ReviewForm.tsx`.
  `verification-code-input.tsx` gained an optional `describedById` prop, forwarded to
  `InputOTP`, so the OTP sites could be wired the same way.
- **Icon-only buttons.** 7 labelled, each using whatever localisation helper that file
  already had in scope (`t()`, `localize()`, or an `isAr` ternary) rather than hardcoding
  English into an Arabic-first UI. Two new keys, `chat.minimize` and `chat.send`, were added
  to the translation table for the AI chat widget.
- **Pseudo-buttons.** Exactly one in the codebase: a `<span onClick>` in
  `health-assessment-page.tsx`, sitting in a flex row beside a real `<button>` with the same
  handler. Given `role="button"`, `tabIndex={0}` and an Enter/Space `onKeyDown` rather than
  converted, because a bare `<button>` carries a UA style reset that could shift the row.
- **Headings.** `AdminShell` rendered an `<h1>` for its optional `title` prop while
  `AdminPageHeader` renders one on every admin page. The `AdminShell` branch is currently
  unreached — the admin layout mounts it without a `title` — but it is a live footgun, so it
  is now an `<h2>` with identical classes. No visual change; heading level and text size are
  independent here.
- **`jsx-a11y/alt-text` re-enabled as `'error'`**, after measuring zero violations with
  `npx eslint src --rule '{"jsx-a11y/alt-text":"error"}'`.

**Dialogs: nothing to fix, which is worth recording.** Radix `Dialog`/`DialogContent` appears
exactly once in the app, in `CommandDialog`, and already renders `DialogTitle` and
`DialogDescription`. Every other modal is a hand-rolled `fixed inset-0` div; the one with a
real ARIA dialog role, `confirm-dialog.tsx`, was already correct (`role="alertdialog"`,
`aria-modal`, `aria-labelledby`, `aria-describedby`, focus management, Escape handling).

Gates verified independently: typecheck 0 · lint exit 0 · 75/75 across 23 files · build exit 0.

### Two corrections to the working notes

1. The plan said ~28 sites would migrate onto the `Field` primitive. In practice **zero**
   did, and the fix was applied directly to the existing markup instead. That was the right
   call — reshaping 28 call sites into `Field`'s render-prop form carried far more visual
   risk than adding four attributes — but it means `Field` now has **no call sites at all**
   (see Batch 7b below).
2. A worker reported "no react-hook-form usage in the app", based on grepping for
   `react-hook-form`. That grep only matches the wrapper, `src/lib/forms/use-app-form.ts`.
   `useAppForm` itself is used in two files, both under `src/features/health-assessment/`.
   Those two forms surface page-level status banners rather than per-field errors, so the
   conclusion — nothing to migrate onto `Field` — happened to hold; the reasoning did not.

---

## Batch 8 — Performance

### Derived state, and the end of `set-state-in-effect`

**16 warnings → 3**, and the 3 that remain are exactly the ones that *should* remain.

The 13 genuine violations were all the same shape: a value computable during render was
instead maintained by an effect that called `setState`. That costs an extra render pass on
every change and leaves a frame of stale UI in between. Each was fixed by deriving during
render — inline where the value is purely a function of props/state, or with React's
"adjust state during render" previous-value comparison where the user must still be able to
override it afterwards:

| File | What was derived |
| --- | --- |
| `courses/ui/CourseCheckoutPage.tsx` | `orderType`/`courseSectionId` clamped to what the backend actually supports once the preview query loads (3 effects) |
| `favorites/.../favorite-toggle-button.tsx` | reset on `initialFavorited` prop change |
| `society/cooperation/CooperationPage.tsx` | default-to-first-type selection |
| `learning/components/course-player.tsx` | default lesson selection; quiz answer reset |
| `health-assessment/.../health-assessment-page.tsx` | page reset on new sections |
| `ai-assistant/.../ai-chat-widget.tsx` | welcome message seeded via lazy `useState` initializer; reset on language change |
| `account/.../newsletter-page.tsx` | `canResend` removed entirely, derived as `countdown <= 0` |
| `account/components/settings-page.tsx` | same `canResendOtp` derivation (dead code, but the rule still flagged it) |

The 3 left alone are genuine synchronisation with an external system, which is what effects
are *for*: the auth token bootstrap (`auth-provider.tsx:100`), the book reading-position
restore (`book-reader.tsx:39`), and the ref-guarded podcast playback restore
(`podcast-player-provider.tsx:60`). Verified untouched in the after-run output. The rule is
therefore still `'off'` rather than `'error'` — turning it on would require three
suppressions, which is the same information expressed worse.

**A latent bug fixed in passing.** The newsletter effect that synced local `email`/`status`
from the backend query listed `[backendStatus, user?.email]` as deps and ran on every
refetch, overwriting whatever the user had typed into the email field. Deriving from a
previous-value comparison means it now only re-syncs when the backend data actually changes.

### `useTransition` in the payment flow

`checkout-page.tsx` tracked `isProcessing` by hand with **8 scattered resets** — 7 early-return
branches and 1 success path. That is precisely the shape where one forgotten reset leaves the
pay button disabled forever. Replaced with `useTransition`: React owns the pending flag, so it
cannot leak. All 8 resets deleted; the disabled state, button label and spinner are unchanged.

### Locale code-splitting

All four locales shipped in one chunk to every visitor, on a site whose default and
overwhelming majority language is Arabic. Split into `src/lib/i18n/locales/{ar,en,fr,es}.ts`,
with `ar` statically imported (it is the default — lazy-loading it would flash untranslated
content on first paint) and the rest behind an **explicit locale → loader map**. Not a
template-literal `import()`: Turbopack cannot statically analyse those and would bundle the
whole directory, defeating the purpose (`bundle-analyzable-paths`).

`t()` stays synchronous, which matters because it is called during render across the app.
`language` and `catalog` are only ever updated together, so there is no render where `t()`
can return a raw key or where text can disagree with `dir`.

| | Before | After |
| --- | --- | --- |
| translations shipped to an Arabic visitor | 70,381 B (all four locales) | 44,703 B (`ar` only) |
| `en` / `fr` / `es` | in that same chunk | 23,305 / 23,712 / 23,310 B, loaded on demand |

**−25,678 B (−36.5%)** for the default visitor. Measured from `.next/static/chunks` plus the
actual `<script src>` tags fetched from a running `next start` — Next 16/Turbopack does not
print the classic First Load JS table.

### Country flags

`phone-input.tsx` statically imported `react-phone-number-input/flags`, which re-exports one
aggregated object of ~250 flag components from a single source module. Confirmed via a real
server that its **340,207-byte chunk was an eager `<script>` on the homepage** — a page that
never renders a phone input. There is no per-flag import path that actually tree-shakes (the
per-country submodule re-exports the same shared file), and the lookup is `flags[country]`,
a computed key, which defeats tree-shaking regardless.

Deferred with `next/dynamic` at its default `ssr: true`, so the resolved flag is still in the
server-rendered HTML — only the client chunk leaves the shared graph. After: 247,642 B and
**absent** from the homepage's script list.

### Correction — a preference-clobbering bug introduced by the locale split, then fixed

The split changed how the active language is initialised, and that introduced a data-loss bug
which the gates did not catch.

The baseline read the saved language in a `useState` **lazy initializer** — synchronously. The
split replaced that with `useState('ar')` plus a mount effect that restores the saved value
*asynchronously*, because a non-Arabic language now has to wait for its chunk. But the
persistence effect still wrote on every change to the rendered `language`. So for a returning
English visitor the mount sequence was:

1. restore effect reads `'en'`, starts loading the `en` chunk, returns;
2. persistence effect runs with `language === 'ar'` and writes **`'ar'` over the saved `'en'`**;
3. chunk resolves, `language` becomes `'en'`, storage is rewritten to `'en'`.

Step 3 usually repairs step 2 — but a failed chunk load, or the user navigating away inside
that window, loses the preference permanently.

Fixed by persisting on the *user's choice* rather than on the rendered value: the write moved
out of the effect and into `setLanguage`. Storage now records what the user picked, not what
happens to be on screen. First-time visitors are left with no stored key at all, which is a
valid state — `base-fetch` already falls back to `'ar'` (the RACE-001 fix), and that fallback
is covered by its own test.

`src/lib/i18n/language-persistence.test.tsx` adds 3 tests. The first was verified to actually
catch the bug: with the write moved back into the effect it fails with
`expected 'ar' to be 'en'`, and passes again once restored.

Gates: typecheck 0 · lint exit 0 · **78/78 across 24 files** · build exit 0.

---

## Batch 5 remainder — redundant `'use client'`

Removed the directive from **52** `.ts` files under `src/features/**` (services and hooks).
None of them is a client/server boundary: every one is reached only through a component that
already carries the directive, so it was pure noise that also fragmented the module graph into
extra client entry points. Verified by `npm run build`, which prerenders 69 static pages and
would fail if any of these had in fact been a real boundary.

---

## Phase 6 rerun — final visual regression

Re-ran the full comparison against the untouched baseline worktree after every batch landed:
195 frames per build, 65 routes × 375/768/1440 px. Build identity asserted via the `preconnect`
marker before trusting any number, and fresh ports used because stale servers from an earlier
run were still holding the old ones.

**189/195 pixel-identical. 0 unintended visual regressions.**

The 6 differing frames were each run down rather than waved through:

| Frames | Verdict | How it was settled |
| --- | --- | --- |
| `home` ×2, `about` ×1 | transient backend data | re-shot interleaved (both servers seconds apart, not in separate passes) — **identical, twice** |
| `encyclopedia` ×2 | **intended** — the RACE-001 fix | baseline renders English, current Arabic; deterministic 22,339 px on both passes |
| `books__768` | broken-image fallback only | a raw `<img>` shows alt text when the image fails; `next/image` shows only the icon. No `alt` was dropped — all 25 `<Image>` tags carry one |

Full detail, including a deployment risk around the image host that could not be resolved from
this network, is in section 6 of `05-final-report.md`.
