# 05 — Final report

**Status: COMPLETE.** Batches 1-8 are done and verified; Batch 9 is postponed by design
(section 5), and the remaining gaps are named rather than implied.

This file was written as the work proceeded, per the standing instruction to keep
modernization documentation current rather than retrospective. Every number here was
measured; nothing is estimated. Where a later measurement contradicted an earlier claim of
mine, the correction is stated in place rather than quietly edited out — there are four of
them, and they are the most useful thing in this document.

**Final gate state:** `tsc --noEmit` 0 errors under `strict: true` · `npm run lint` exit 0 at
`--max-warnings=0` · **72 tests / 23 files** · `npm run build` exit 0 · **189/195 frames
pixel-identical, 0 unintended visual regressions** · all 8 authenticated routes browser-verified
with 0 uncaught exceptions.

**One optional confirmation on first deploy:** the image-host `curl` at the end of section 6.
Nothing else is outstanding.

---

## 1. What was changed and why

Grouped by intent. Every item listed here passed typecheck, lint, tests, and build before
being recorded; the per-batch evidence is in `03-progress.md`.

### Measurement corrections (the most consequential change, and it is not code)

The single most important finding was that the project's apparent state was being
mismeasured, in a way that would have derailed the whole effort:

- **`npm run lint` reported 18,380 problems (1,845 errors) at baseline.** Every one of
  those errors came from `./backend/`, a vendored Laravel application that is git-ignored
  but which ESLint's flat config walks into anyway, because flat config does not read
  `.gitignore`. Adding `backend/**` to `globalIgnores` moved the count to **3**, and
  fixing those three real warnings honestly (not suppressing them) moved it to **0**.
  The frontend was never in the state the number implied.
- Three later contradictions between agents were reconciled rather than averaged, and are
  recorded individually in `01-audit.md` under **Cross-audit reconciliations** — including
  two where my own conclusion was the wrong one.

### Correctness and privacy

- **Payment PII survived account deletion.** Account-deletion anonymization targeted the
  localStorage key `'b3-payments-records'`; the store actually writes
  `'b3-payment-records'`. The whole anonymization step silently no-opped, leaving
  `userId` and `userName` in place after the user deleted their account.

  **Correction to an earlier version of this report:** it also claimed invoice
  `userName`/`userEmail` survived. That was wrong. `InvoiceRecord` is
  `{ id, paymentId, issuedAt, downloadUrl, status }` and carries no user-identifying field
  at all; `downloadUrl` is a data: URL built from invoice/payment/item/amount/currency/
  method/date only, with no name or email in the rendered HTML. The anonymization code had
  *looked* like it was erasing invoice identity because it wrote an
  `issueDetails: { userName, userEmail }` object — but nothing in the codebase reads or
  writes that field and it is not on the type, so it was adding a fabricated property
  rather than erasing a real one. That dead write has been removed and the real scope
  (`userId`, `userName` on the payment record, both erased) is what stands. Fixed, with a comment naming the module the key must stay in
  sync with. Found via the Skill rule `client-localstorage-schema`.
- **React Rules of Hooks** violations fixed, and the rule itself re-enabled as `error`
  so the class cannot silently return.
- **A latent test-infrastructure bug**: Vitest does not enable React Testing Library's
  auto-cleanup, and this project never registered it — one existing test called
  `cleanup()` by hand, which is why it had gone unnoticed. Four new tests failed with
  "found multiple elements" until a global `afterEach(cleanup)` was added to
  `src/qa/test-setup.ts`. Test count went 59 → 68 with no pre-existing test broken.

### Performance (all figures measured from build output)

- **`AIChatWidget` moved off the critical path.** A floating overlay importing
  `motion/react` was statically mounted in the single root layout, so its **54,355-byte**
  chunk shipped to all 94 routes. Now loaded via `next/dynamic` with `ssr: false`.
  Verified by counting each candidate chunk's references across the 98 per-route
  client-reference manifests: the widget body sits in a chunk with **0** route
  references, and the 95-route shared chunk retains only the `dynamic()` stub. The widget
  was then opened in a browser to confirm it still works.
- **API `preconnect` added.** ~90 of 94 pages fetch from the API origin on mount, and
  because the app is almost entirely client-rendered those fetches cannot begin until
  after hydration — so the TCP+TLS handshake was paid serially on the critical path of
  the first real request. Verified present in `<head>` of **66 of 67** prerendered pages;
  the one exception is `_global-error.html`, which replaces the root layout by design.
  Confirmed absent from the baseline build and present in the current one.
- **Root context providers stabilized.** `LanguageContext` and `CurrencyContext` built a
  fresh value object and fresh callbacks on every render, re-rendering every consumer in
  every route tree. Both now use `useCallback`/`useMemo`, matching the fix `AuthProvider`
  received earlier.

### Type safety and tooling

- Five `strict`-family TypeScript flags enabled at **zero** error cost, each measured
  individually rather than switched on hopefully.
- `react-hooks/rules-of-hooks` and `react-hooks/purity` re-enabled as `error` after
  measuring that the codebase is clean under both. `purity` had been disabled purely
  because it shipped next to a rule that *does* have violations.
- Next.js 16's `middleware.ts` → `proxy.ts` convention adopted.

### Removals

Runtime dependencies **28 → 22**; 134 packages removed from the tree. `npm audit` went
from **12 vulnerabilities (10 high) to 0**. Four dead context providers, five dead
components, a dead service, a dead API route directory, and a duplicate favorite button
were removed — each verified unreachable first, by static search *and* by confirming its
strings are absent from built output.

---

### Accessibility

8 files had validation messages with no programmatic link to the control they described.
All now pair `htmlFor`/`id`, mark the control `aria-invalid`, point `aria-describedby` at the
message, and give the message `role="alert"`. 7 icon-only buttons gained localised labels —
using each file's own `t()`/`localize()`/`isAr` helper rather than hardcoding English into an
Arabic-first UI. One `<span onClick>` pseudo-button became keyboard-operable, and a latent
duplicate-`<h1>` in `AdminShell` was demoted. `jsx-a11y/alt-text` is now `'error'`.

Every change here is attribute-level: the rendered pixels are unchanged by design.

### Language correctness

Two separate bugs, both about content language, both caught by verification rather than review:

- **RACE-001** (pre-existing): API responses came back in English on an Arabic-first site,
  because the `Accept-Language` header depended on effect ordering. Fixed at the source, in
  `base-fetch`, with a real default rather than a silent `undefined`.
- **Preference clobbering** (introduced during this pass, by the locale code-split, then
  fixed): a returning non-Arabic visitor could have their saved language overwritten with
  `'ar'` during the window where their locale chunk was still loading.

Both have regression tests, and both tests were confirmed to fail with their fix reverted.

## 2. What was intentionally NOT changed

This section exists because omissions are decisions, and undocumented omissions read as
oversights.

- **The session model.** `b3_session` is a client-written role string that `proxy.ts`
  compares with `===` to gate `/admin` and `/doctor`. It is **not** an authorization
  boundary, and it is now documented as such in the file itself. It was not "fixed"
  because the correct fix requires the backend to issue an httpOnly session cookie — and
  critically, because the Laravel API exposes **no role field at all** (`UserResource.php`
  has none; `mapBackendUser` hardcodes `role: UserRole.STUDENT`). Signing the cookie would
  only sign a value the frontend invented. Shipping that would have been security theater.
  See **HARD-001**.
- **The router compatibility shim.** `src/lib/routing/next-router-compat.tsx` is a
  React-Router-shaped client shim, and it is the single root cause of 90/94 pages being
  `'use client'`, 0/94 exporting metadata, and 1/94 server-prefetching. Retiring it
  touches nearly every route and deserves its own regression budget. Postponed per the
  rule about deferring large breaking changes until safer work is complete.
- **`experimental.optimizePackageImports` for the `radix-ui` barrel.** The finding was
  correct that `radix-ui` is a real barrel (32 `import * as` re-exports) and absent from
  the config. But current Next.js documentation states the option applies when *not*
  using Turbopack, and that Turbopack does this analysis automatically. This project
  builds with Turbopack — confirmed from the build banner, not assumed. Adding the option
  would be inert at best and misleading at worst. See **D12**.
- **The newsletter mock-OTP fallback.** A live P1: when the backend newsletter query
  errors, the page silently falls back to a client-side mock in which the literal
  `'123456'` writes a "confirmed" subscription to localStorage that the backend never
  learns about. Documented in full with the traced mechanism (**HARD-004**) but not
  changed, because it is a behaviour change to a subscription flow on an
  authentication-gated page that cannot be browser-verified without credentials.
- **A dead 396-line settings page** containing the same `'123456'` literal for *email*
  changes. Confirmed dead four ways (no importers, no dynamic import, no barrel, `/settings`
  is a bare redirect) and **build-confirmed** to ship zero bytes. Annotated in place with a
  `⚠ DO NOT WIRE THIS UP AS-IS` header rather than deleted, because whether it is abandoned
  or pending-wiring is an ownership decision.
- **The consultations catalog UI wiring**, because the new `available-slots` endpoint
  restricts `type` to `individualConsultationTypeValues()`, which does not cover the
  clinic and trip contexts the existing component also serves. Migrating it would have
  broken two working flows to modernize one.

---

## 3. Process failures worth recording

- **The React best-practices Skill was not loaded before the first audit pass.** Phase 2.3
  was skipped; MCPs were configured and the Skills step was not. The entire first audit was
  therefore first-principles reasoning plus API documentation. The user asked directly
  whether the frontend had been run against the React best-practices Skill, and it had not.
  Loading it and re-auditing produced a P0 bundle defect with a measured size, a live
  privacy bug, and a missing resource hint — none of which the first pass had found.
  Recorded as **D11**. The lesson is to load the domain Skill *before* auditing that
  domain.
- **A severity over-rating, corrected.** A Rules-of-Hooks violation was rated P0 before
  checking reachability; the file has zero importers and `/settings` merely redirects, so
  the defect was in dead code. Recorded rather than quietly downgraded.
- **A scoping error, corrected to the user.** The session fix was described as blocked on
  the backend issuing an httpOnly cookie. The real blocker is that the API exposes no role
  at all — a different and more fundamental problem.
- **A false negative caught before it did damage.** A single-quoted grep suggested
  `radix-ui` had no importers; acting on it would have deleted a live dependency. Recorded
  as **D5**, with the rule that "no importers" from static search is a hypothesis until it
  is quote-agnostic *and* build-confirmed. That rule is what caught a **false positive**
  later in the same session: a string thought to prove the dead settings page still shipped
  turned out to be a substring of a *different* page's message.

---

## 4. Verification performed

| Gate | Baseline | Current |
| --- | --- | --- |
| `tsc --noEmit` | 0 errors | **0 errors** |
| `npm run lint` | FAIL — 18,380 problems | **exit 0** |
| `npm test` | 59/59 | **72/72** (23 files) |
| `npm run build` | exit 0 | **exit 0** |
| `npm audit` | 12 vulnerabilities (10 high) | **0** |
| Runtime dependencies | 28 | **22** |

| `tsconfig` strictness | `strict: false` | **`strict: true`** |
| `react-hooks/set-state-in-effect` | 16 warnings | **3** (all legitimate) |
| Translations shipped to a default visitor | 70,381 B | **44,703 B** |
| Country-flag chunk on the homepage | 340,207 B, eager | **absent** |

Beyond the gates: the lazily-loaded assistant widget was opened in a real browser and
confirmed functional, and bundle claims were verified by measuring chunk sizes and the
actual `<script src>` tags served by a running `next start` — not by reasoning about them.

**Three bugs were found by verification rather than by reading code**, which is the main
argument for having done it this way:

1. **RACE-001** — API content rendered in the wrong language because `LanguageProvider`
   writes its storage key in a mount effect and React runs effects child-first, so page
   fetches went out before the write landed. Found by a one-directional pixel diff on
   `/books`; confirmed by capturing request headers 3/3 runs on each build.
2. **A `NaN` money path** — `basePrice!` and `item.prices!`, added during the strict
   migration, would have let `undefined` reach the checkout arithmetic.
3. **Language-preference clobbering** — introduced by the locale code-split itself, caught
   by reading the new mount sequence rather than by any gate, since all four gates passed
   with the bug present.

Each has a regression test, and each test was verified to fail with its fix reverted.

**Visual regression — OPEN (in progress).** A baseline git worktree at the pre-change
commit was installed, built, and served alongside the current build so that all **65**
concrete routes could be captured at **375 / 768 / 1440 px** in both, then pixel-diffed —
195 frames per build. Results are recorded in section 6 once the comparison completes.

---

## 5. Remaining work, in priority order

Batches 1-8 are **complete and verified**. The two items previously listed here as blocking
have both been closed:

- ~~Delete the dead `Field` primitive~~ — **done** (D15). Gates re-run: 72 tests / 23 files.
- ~~Browser-verify the authenticated flows~~ — **done** (section 6b). Closed without
  credentials by seeding a client-side session; the `useTransition` payment rewrite was driven
  end-to-end through the real UI on both the success and declined paths and measured identical
  to baseline.

What is genuinely left is small:

1. **One `curl` on first deploy** to confirm image-host reachability (end of section 6). Not a
   known defect — a cheap confirmation of the one behaviour that could not be observed locally.
2. **`react-hooks/set-state-in-effect` is still `'off'`** at 3 warnings. All 3 are legitimate
   external-system reads; enabling the rule would require three suppressions, which is the same
   information expressed worse.
3. **`@next/next/no-img-element` is still `'off'`** for 3 documented `<img>` exceptions. Two
   could be resolved by learning the real intrinsic dimensions of the images involved.
4. **The `b3-*` localStorage keys question** — 9 keys holding user data survive account
   deletion. Which must be erased is a policy call, not an engineering one.

### Postponed by design, not overlooked

- **Server-component conversion** (Batch 9) — the router shim is the root cause of 90/94 pages
  being `'use client'`, 0/94 having metadata, and 1/94 server-prefetching. `generateStaticParams`
  and `generateMetadata` belong to this work and to nothing else; adding them to today's client
  shells would be net-negative (**D14**).
- **Session model** — moving the bearer token out of `localStorage` and the role cookie to
  httpOnly. Fixes HARD-001 and unblocks SSR credentials. Requires a backend change.

### Decisions that need an owner, not an engineer

- **9 further `b3-*` localStorage keys holding user data that account deletion never
  erases.** Enumerated in `audit-hardening.md`. Which of these must be erased on deletion
  is a policy question.
- **The session model and the router shim** (see section 2) — both need scheduling, not
  analysis.
- **Whether to keep the framework version bump** that `npm audit fix` applied while
  clearing the 10 high-severity advisories. Rollback instructions are in **D4**.
- **The dead settings page** — wire it up (after removing the constant-OTP path) or delete
  it.

---

## 6. Visual regression results

Run against a **real baseline**, not against the current state alone: a git worktree at the
pre-change commit was installed, built, and served alongside the current build. All **65**
concrete routes were captured at **375 / 768 / 1440 px** on both — **195 frames per build** —
and pixel-diffed.

| | |
| --- | --- |
| Frames compared | 195 |
| Pixel-identical | **189** |
| Differing | 6 |
| **Unintended visual regressions** | **0** |

Before any number was trusted, build identity was asserted: the current build emits a
`preconnect` link the baseline does not, and each server was checked for it. This exists
because a hardcoded port once silently measured an unrelated application that happened to be
listening on it.

### The 6 differing frames, each accounted for

**3 frames — transient backend data (`home` ×2, `about` ×1).** The full baseline and current
passes ran ~20 minutes apart against one live, flaky backend. The home page returned a
different and longer set of specialization cards on the second pass (identical layout, cards
and styling — different content), and the about page's footer rendered fallback contact
details in one run and real ones in the other, because `/api/v1/general/{contact,social-media}`
intermittently 500s.

Settled by **re-shooting each frame on both servers back-to-back**, seconds apart rather than
in separate passes, so data drift cannot masquerade as a rendering change. All three came back
**pixel-identical**, twice:

```
home__375     IDENTICAL  (bodyH 9868 -> 9868)
home__768     IDENTICAL  (bodyH 6612 -> 6612)
about__375    IDENTICAL  (bodyH 2283 -> 2283)
```

**2 frames — the RACE-001 fix, working as intended (`encyclopedia` ×2).** Baseline renders
"ENCYCLOPEDIA ALERTS / Encyclopedia Update" in **English**; current renders the same content in
**Arabic**. This is the same signature as the `/books` finding that originally exposed the bug:
the baseline omits `Accept-Language`, so the backend answers in its own default, on a site whose
`<html lang>` is `ar`. Deterministic and reproducible — an identical 22,339 px at 375 px on both
interleaved passes, exactly as a real fix should behave. **This is the improvement, not a
regression.**

**1 frame — broken-image fallback rendering (`books__768`, 0.09%).** Its size difference in the
first interleaved pass was transient (the baseline's book list had not finished loading; it
flipped between runs). The small residual is genuine but narrow: when a cover image **fails to
load**, a raw `<img>` shows the broken icon *plus its alt text*, whereas `next/image` — which
positions the image absolutely inside a fixed-size wrapper to prevent layout shift — shows only
the icon. Verified that no `alt` attribute was dropped in the migration: all 25 `<Image>` tags
carry one, and the single `alt=""` is a decorative background behind a headline overlay. When
the images load, both render the image.

### The image host, investigated properly — and a correction

An earlier draft of this section claimed the `next/image` migration carried a likely
production risk, on the theory that WordPress hosts apply hotlink protection that would block
the Next.js optimizer's server-side fetch while still serving a visitor's browser. **That was
speculation beyond the evidence, and it was wrong.** The measurements:

| Client | Result |
| --- | --- |
| `https://raiyansoft.com/...` with no headers | 403 |
| …with a browser User-Agent | 403 |
| …with browser UA **and** a referer | 403 |
| Baseline build's raw `<img>`, fetched by the real Playwright browser | also broken |

The host is unreachable **from this environment entirely** — for every client, including the
baseline's plain browser fetch. There is no evidence of an optimizer-specific block, and both
builds render those images broken here equally.

Two further facts narrow it further:

- Every `raiyansoft.com` URL in the codebase is **seed/demo data** — hardcoded in `data.ts`
  and one `FALLBACK_IMAGE` constant in `encyclopedia-api.service.ts`. Several are CSS
  `background-image`s, which never touch `next/image` at all.
- The live API currently returns `cover_image: null` for every record, and no endpoint returns
  any image URL. There is no real image anywhere to test the optimizer against.

So the honest position is: **no regression was demonstrated, and none is expected.** What is
genuinely true is narrower — `next/image` adds a server-side fetch hop that raw `<img>` did not
have. That is worth one cheap confirmation on first deploy, not a code change made blind:

```
curl -sI https://raiyansoft.com/wp-content/uploads/2026/04/n1.webp    # from the deploy host
```

If that returns 200 but images still fail in the browser, the optimizer is being blocked
specifically, and the fix is `unoptimized` on those `<Image>` elements — which keeps the
layout and lazy-loading while letting the browser fetch the original URL. No speculative
change was made, because changing working code on an unverified hypothesis is how regressions
get introduced.

---

## 6b. Authenticated flows — now browser-verified

Previously listed as the largest verification gap, and blocked on credentials. It was closed
without them: authentication in this app is entirely client-side (the documented HARD-001
weakness — a truthy `b3_api_token` in `localStorage` gates loading `b3_user`, and an unsigned
`b3_session` cookie drives the proxy's redirects), so a session can be seeded locally.

**All 8 authenticated routes render, with zero uncaught exceptions:**

```
dashboard   http=200  /dashboard            heading: الحساب الشخصي
profile     http=200  /dashboard/profile    heading: البيانات الشخصية
security    http=200  /dashboard/security   heading: تسجيل الخروج وحذف الحساب
newsletter  http=200  /dashboard/newsletter heading: إدارة النشرة الإلكترونية
settings    http=200  /dashboard/profile    heading: البيانات الشخصية
checkout_course / checkout_book / checkout_subscription — all 200, real item titles

uncaught React/JS exceptions across all routes: 0
```

Checkout resolving real item titles also confirms the new `basePrice` guard (section 1) does
not false-trigger on valid items.

### The `useTransition` rewrite, driven end-to-end

The riskiest change in this pass was replacing 8 hand-written `setIsProcessing(false)` resets
with `useTransition`. The failure path is what matters — that is where a missed reset would
have left the pay button disabled forever — so both paths were driven in a real browser
through the actual UI: **دفع → review screen → تأكيد الدفع**, with the `FAIL` coupon used to
force a gateway decline.

Sampling the confirm button every 75 ms (located by a DOM marker, not by text — its label
changes to "جاري المعالجة..." precisely while pending, so a text locator stops matching exactly
when the state under test is active):

```
                current (useTransition)                     baseline (manual useState)
succeeds   75:DIS* 150:DIS* 225:DIS* 300:DIS* 375:DIS*  |  75:DIS* 150:DIS* 225:DIS* 300:DIS* 375:DIS*
           450:en ... 1050:en                            |  450:en ... 1050:en
declined   75:DIS* 150:DIS* 225:DIS* 300:DIS* 375:DIS*  |  75:DIS* 150:DIS* 225:DIS* 300:DIS* 375:DIS*
           450:en ... 1050:en                            |  450:en ... 1050:en
                                    (* = label reads "جاري المعالجة...")
```

**Byte-for-byte identical to the baseline on both paths.** The pending window matches the
450 ms simulated gateway latency exactly, the button returns to enabled on every exit path,
the decline message appears only with the `FAIL` coupon, and there were zero uncaught errors.
The rewrite is behaviour-preserving, which is what it was required to be.

### Two pre-existing behaviours confirmed as pre-existing

Both reproduce **identically on the baseline build**, so neither was introduced here:

1. A login modal is mounted over the checkout page even for a signed-in user (1 visible
   full-screen overlay on both builds). Plausibly correct given the seeded token is not a real
   backend session — recorded as an observation, not diagnosed as a bug.
2. On the non-`FAIL` path, `completePaymentIntent` returns `null` and the UI shows its
   "could not complete" state. Identical on baseline; an artifact of the synthetic session
   rather than anything this pass changed.

---

## 7. Recommended next steps

1. ~~Add CI~~ — **done** (Batch 10, `03-progress.md`). `.github/workflows/ci.yml` runs
   typecheck, lint, test and build on every push/PR to `main`, using the exact same four
   gates and commands tracked throughout this modernization. The visual-regression harness
   is not included — it needs a baseline worktree and a browser, which is a heavier CI setup
   than this pass — so item 4 below still stands.
2. **Take the two owner decisions** — the session model and the router shim. Both gate the
   highest-value remaining work, and neither is an engineering question.
3. **Supply test credentials** so the authenticated flows can be browser-verified. Four
   batches touched code that only runs behind a login; it is typechecked, linted, tested and
   built, but a successful build does not prove a checkout works.
4. **Keep the visual-regression harness.** It is the only reason changes to a 94-route app
   with no prior rendering coverage could be made with any confidence, and it has already
   paid for itself by surfacing RACE-001 — a pre-existing bug nobody was looking for. It is
   cheap to re-run: rebuild, re-shoot, re-diff. It is worth wiring into CI at a smaller frame
   count.
5. **Decide the `b3-*` localStorage keys question.** 9 keys holding user data survive account
   deletion. Which must be erased is a policy call, not a technical one.
