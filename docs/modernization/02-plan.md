# 02 — Modernization Plan

Ordered in batches. Each batch is independently shippable and independently
verifiable. Nothing is checked off until it has passed typecheck + lint + tests +
build, and behaviour has been exercised where it is observable.

**Sequencing principle:** correctness and the tooling that *detects* correctness come
first, then type safety at the boundary, then the accessibility primitives (one fix
propagates to ~28 call sites), then Next.js surface work, then the backend
integration, then cleanup. The one genuinely large architectural change — the router
shim — is deliberately **last and postponed**, per hard rule 23.

Verification loop for every batch:
`UNDERSTAND → DOCS → CHANGE → TYPECHECK → LINT → TEST → BUILD → RUN → BROWSER → CHECKLIST`

---

## Batch 1 — Tooling, gates, and free wins ✅ COMPLETE

Goal: make the checks trustworthy before changing code they're supposed to guard.

- [x] Install dependencies (`node_modules` was absent) — exit 0
- [x] Record measured baseline in `00-project-baseline.md`
- [x] Configure Context7 MCP for the project (`.mcp.json`, HTTP transport mirroring the known-good global config)
- [x] Store the Context7 API key in `.claude/settings.local.json` and **gitignore it** — verified with `git check-ignore` that git cannot see the token
- [x] Mirror the project's existing `shadcn` MCP choice into `.mcp.json`
- [x] Fix the lint gate: add `backend/**` to `globalIgnores` — **18,380 problems → 3**
- [x] Fix the 3 real `react-hooks/exhaustive-deps` warnings honestly (memoize `filters` in `booking-slot-selector.tsx`; memoize `messages` in `chat-consultation.tsx`) — **`npm run lint` now exits 0**
- [x] `npm audit fix` — **12 vulnerabilities (10 high) → 0**
- [x] Remove 6 unused dependencies: `@google/genai`, `jspdf`, `react-markdown`, `@radix-ui/react-{dialog,dropdown-menu,tabs}` — 134 packages removed
- [x] Enable the 5 measured-zero-cost strict flags (`strictFunctionTypes`, `strictBindCallApply`, `noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`)
- [x] Migrate `src/middleware.ts` → `src/proxy.ts` (`export function proxy`), per Next 16 convention confirmed via Context7 — build deprecation warning gone
- [x] Untrack `tsconfig.tsbuildinfo` and gitignore it
- [x] Verify: typecheck 0 errors · lint exit 0 · 59/59 tests · build exit 0

## Batch 2 — React correctness (P0) ✅ COMPLETE

Goal: fix the two P0 defects, then turn the rule that would have caught them back on.

- [x] Fix `settings-page.tsx:19-22` Rules-of-Hooks violation — all hooks now unconditional; `navigate()` moved into an effect. **Note:** this component turned out to be unreachable (zero importers; `/settings` just redirects), so the defect was in dead code — fix kept as landmine removal, severity was over-rated
- [x] Fix `podcast-player-provider.tsx:49-66` restore/auth-hydration race — added an `isAuthReady` flag and gated the restore on it, replacing the one-shot ref lock
- [x] Resolve `settings-page.tsx` dual source of truth for `addresses` — query cache is now the single source
- [x] Memoize the `AuthContext` value (`auth-provider.tsx`) — ~18 functions wrapped in `useCallback`, value `useMemo`'d
- [x] **Re-enabled `react-hooks/rules-of-hooks` as an error** — verified clean before enabling; `npm run lint` still exits 0
- [x] `react-hooks/set-state-in-effect` + `react-hooks/purity` measured at **15 warnings** — left off, count recorded in `eslint.config.mjs`
- [x] Verify: typecheck 0 · lint exit 0 · 68/68 tests · build exit 0 — browser pass still outstanding (see Batch 10)

## Batch 3 — Type safety at the boundary

Goal: stop trusting network JSON, then take `strictNullChecks`.

- [ ] Add zod schemas at the API boundary and parse in `apiFetch` (P0 #3). `zod` is already a dependency and already proven in the forms layer — no new dependency
- [ ] Fix the GDPR erasure `any[]` shape assumption (P0 #4)
- [ ] Resolve the two conflicting `SubscriptionPlan` interfaces (P0 #5) — one canonical type
- [ ] Validate `readLocalStorageJson<T>()` instead of casting
- [ ] Consolidate the duplicated `CareBooking*` / `InitialConsultationTypes` clusters into one shared type
- [ ] Fix the 11 unguarded `user` accesses in `checkout-page.tsx` and the non-null assertion in `care-records-storage.service.ts:211`
- [ ] Enable `strictNullChecks` (measured: 26 errors) and clear them
- [ ] Enable `noImplicitAny` (measured: 12 errors) and clear them
- [ ] Flip `strict: true` once both are clean, and drop the now-redundant individual flags
- [ ] Re-enable `@typescript-eslint/no-explicit-any` and `no-unused-vars`
- [ ] Verify after each flag, not at the end

## Batch 4 — Accessibility foundation

Goal: fix the shared primitives once so ~28 call sites improve without touching 28 files. **Zero visual change.**

- [ ] Add `aria-invalid` + `aria-describedby` support to `ui/input.tsx`, `ui/textarea.tsx`, `ui/label.tsx`
- [ ] Make `FormFieldError` the actual error renderer and wire it to `aria-describedby` (it currently has zero consumers)
- [ ] Migrate the ~28 hand-rolled red-text field errors onto `FormFieldError` — identical appearance, correct semantics
- [ ] Give icon-only buttons accessible names (`aria-label` or `sr-only`); adopt `size="icon"` where it matches existing styling
- [ ] Convert `<div onClick>` / `<span onClick>` pseudo-buttons to real `<button>` with matching styles
- [ ] Add `alt` text to the 4 informative thumbnails currently using `alt=""`
- [ ] Fix the `AdminShell` / `AdminPageHeader` duplicate-`<h1>` risk
- [ ] Add `DialogTitle`/`DialogDescription` where Radix Dialog lacks them
- [ ] Re-enable `jsx-a11y/alt-text`
- [ ] Verify: screenshots at 375 / 768 / 1440 before and after must be identical; keyboard-navigate a form and a dialog

## Batch 5 — Next.js surface

Goal: error boundaries, SEO, and image optimization — without the router rewrite.

- [x] Add `error.tsx` per route group (previously zero anywhere) — all 9 groups, plus `global-error.tsx`
- [x] Add `loading.tsx` for the slower route groups — 6 groups
- [ ] Migrate the 25 raw `<img>` to `next/image` — the 4 `remotePatterns` are already configured
- [ ] Re-enable `@next/next/no-img-element`
- [x] Add `sitemap.ts` and `robots.ts` — both resolve as static routes (`/sitemap.xml`, `/robots.txt`)
- [ ] Add `metadata` to the pages that are already server components, plus any page that can be converted cheaply
- [ ] Remove the pointless `'use client'` from the 27 `*.service.ts` files and from the zero-hook leaf components (`BookCard.tsx`, `admin-page-header.tsx`)
- [ ] Replace the 4 raw internal `<a href>` in `auth-page.tsx` with `next/link`
- [ ] Verify: build output shows expected static/dynamic split; no hydration warnings in console

## Batch 6 — Backend API integration

Goal: consume what the backend pull actually added. Delta:
[backend-api-delta.md](backend-api-delta.md). All changes are **additive** — no
breaking field renames — so this is new surface, not repair.

- [x] Favorites feature — `GET /api/v1/user/favorites`, `POST .../favorites/toggle`, `DELETE .../favorites/{id}`, wired into the dashboard favorites page (replacing a fully mock/localStorage implementation)
- [x] Surface the new `is_favorited` boolean from the 7 detail endpoints (books, courses, clinics, encyclopedia news, herbal library, plants-fungi, trips) with optimistic toggling and rollback, via one shared `FavoriteToggleButton`
- [x] Consultations catalog — services + hooks for all 4 public GET endpoints **(data layer only; not wired to a component — see below)**
- [x] Individual consultation booking — services + hooks for `book` and `fulfill-slot` **(data layer only)**
- [x] Feature-root `query-keys.ts` for each new feature, per `AGENTS.md`
- [x] zod schemas for every new response shape, parsed at the boundary
- [x] Response envelope verified against `PaginationTrait::paginatedData` + `apiFetch`'s `data` unwrapping, rather than assumed
- [ ] **BLOCKED — consultations catalog UI wiring.** `booking-slot-selector.tsx` serves individual **and** clinic **and** trip contexts, but the new `available-slots` endpoint is doctor-scoped and its `type` is restricted to individual-consultation values only — it does not cover clinic or trip slots. Wiring it wholesale would break clinic/trip booking. Needs a decision on how the doctor-centric endpoints coexist with the existing clinic/trip slot model. Hooks are ready to consume once settled.
- [ ] Verify against a running backend — not possible here (no credentials); correctness so far rests on matching the documented contract plus typecheck/lint/tests/build

## Batch 7 — Dead code removal ✅ COMPLETE (one item deferred)

Goal: delete only what is provably unreferenced. Live/dead split already established
in the baseline — **do not** delete `LanguageContext.tsx`, `CurrencyContext.tsx`,
`types.ts`, `data.ts`, `components/UI.tsx`, `components/Graphics.tsx`. (All six left intact.)

- [x] Unmounted and deleted the 4 zero-consumer root contexts: `BlogContext.tsx`, `ResearchContext.tsx`, `TheoryContext.tsx`, `CourseCommentContext.tsx` — provider nesting order preserved
- [x] Deleted the 5 zero-import root files: `components/Layout.tsx`, `components/QuizPlayer.tsx`, `components/HealthAssessmentForm.tsx`, `components/AIChatWidget.tsx`, `services/geminiService.ts` — the last two turned out to be dead re-export shims
- [x] Deleted the `/api/ai/chat` stub route after confirming zero references and that the real assistant does local keyword lookup only
- [x] Also removed `src/features/account/components/favorite-button.tsx` — the old localStorage favorite button, superseded by `FavoriteToggleButton` in Batch 6
- [ ] **Deferred:** remove the fake `'123456'` OTP fallback in newsletter management — fail visibly instead. Not a deletion-safety question; it needs a decision on what the UI should do when that backend query errors
- [x] tsconfig `include` **cannot** be narrowed to `src/**` — verified the remaining root files are still load-bearing, as are `next.config.ts` / `vitest.config.ts`
- [x] Verified each deletion group with the full suite; clearing `.next` was required after the route deletion because Next's generated validators still referenced it

## Batch 8 — Performance

- [x] Lazy-load `AIChatWidget` with `next/dynamic` so `motion` stops shipping to every route
      — **verified**: widget body now in a chunk with 0 server-route references; the
      95-route shared chunk retains only the `dynamic()` stub. Was 54,355 B on all 94 routes.
- [x] Add a `preconnect` to the API origin — **verified** present in `<head>` of 66/67
      prerendered pages (`_global-error.html` replaces the root layout, so it is exempt).
- [x] Decide the `radix-ui` barrel finding — **no change required** under Turbopack; see D12.
- [ ] Split or lazy-load `LanguageContext` (72 KB on disk → 68,500 B chunk) so it isn't in
      every route's critical path. Keep `ar` (the `<html lang>` default) inlined so first
      paint is not blocked; lazy-load the other three via an explicit locale→loader map
      (not a template-string path — `bundle-analyzable-paths`).
- [ ] Memoize the `LanguageContext` and `CurrencyContext` provider values — the same fix
      `AuthProvider` already got in Batch 2, across ~94 consumers (`rerender-defer-reads`).
- [x] ~~Add `generateStaticParams` to catalog detail routes so they can be static~~ —
      **rejected on inspection, see D14 in `04-decisions.md`.** Every public dynamic
      route is a `'use client'` shell that never reads `params`; the id is read via
      `useParams()` and the data is fetched in the browser. Prerendering would bake an
      identical empty shell per id (no user-visible gain) while making the build call a
      demonstrably flaky backend to enumerate ids (a fragility increase). The worthwhile
      version of this is the server-component conversion, moved to Batch 9.
- [x] **RACE-001** — make API request language deterministic instead of dependent on React
      effect ordering; found by the Phase 6 visual regression, fixed and browser-verified
- [ ] **Owner decision:** send the default UI language on the *server* too, so `/books`
      stops prerendering in English and swapping to Arabic on hydration (content flash +
      wrong-language HTML for crawlers). Changes search-indexable output — see 01-audit.md.
- [ ] Measure route-level bundle sizes before and after; record real numbers, not estimates
- [ ] `checkout-page.tsx`: replace the manually-reset `isProcessing` flag (reset from 8
      scattered call sites — a real stuck-spinner risk) with `useTransition`
      (`rendering-usetransition-loading`)
- [ ] `CourseCheckoutPage.tsx:32-42,63-65`: derive `orderType`/`courseSectionId` during
      render instead of via four chained correcting effects (`rerender-derived-state-no-effect`)
- [ ] Defer `phone-input.tsx`'s ~250 country flag SVGs + `cmdk` Command primitives until the
      country popover is first opened (P2 — verify a distinctly-sized, low-reference-count
      chunk actually appears, since the current chunk signature is ambiguous)
- [ ] Reduce the 16 `react-hooks/set-state-in-effect` warnings to zero, then re-enable the
      rule as `error`. 13 are genuine; **3 are legitimate** one-time external-system reads
      (auth token bootstrap, book reading position, ref-guarded podcast restore) and must
      not be "fixed" — see `audit-vercel-rerender-rendering.md`.

## Batch 9 — Postponed: architecture

**Deliberately not attempted in this pass.** Documented per hard rule 23.

- [ ] **POSTPONED — Session model.** Replace the client-written `b3_session` role
      cookie with an httpOnly, Secure cookie issued by the Laravel API, and move the
      bearer token out of `localStorage`. This fixes HARD-001 *and* unblocks SSR
      credentials in one change. **Blocked: requires a backend change and is a
      coordinated decision, not a unilateral frontend edit.** Highest-value item on
      this list.
- [ ] **POSTPONED — Router shim.** Retire `src/lib/routing/next-router-compat.tsx`
      and let pages receive server `params`/`searchParams`. This is the root cause of
      90/94 pages being `'use client'`, 0/94 pages having metadata, and 1/94 server
      prefetching. It touches nearly every route, so it needs its own effort with its
      own regression budget — not a sub-task of a cleanup pass.
    - This is also the only context in which `generateStaticParams` and
      `generateMetadata` are worth adding to the ~10 public catalogue detail routes.
      On their own, against today's client shells, they are net-negative — see D14.
      Once a route fetches on the server, all three land together and actually deliver
      SEO and a faster first paint.

## Batch 10 — Final verification

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Run the app; exercise home, auth, dashboard, a CRUD flow, checkout, admin, and the new favorites/consultations surfaces
- [ ] Browser console clean — no errors, no React warnings, no hydration warnings
- [ ] Network tab clean — no unexpected 404/500
- [ ] Responsive check at 375 / 768 / 1440
- [ ] No unintended visual regressions vs the Batch-4 screenshots
- [ ] `05-final-report.md` written

---

## Out of scope

- **i18n / RTL** — deferred by `AGENTS.md`. `lang`/`dir` are hardcoded; recorded in
  the audit, not scheduled.
- **Version upgrades** — the stack is already current (Next 16, React 19, Tailwind 4,
  TanStack v5). Nothing is upgraded except the transitive patches `npm audit fix`
  pulled in, which are recorded in `04-decisions.md`.
- **Visual redesign** — preserving the existing visual identity is a hard
  requirement. No custom UI is replaced with stock shadcn.
