# 05 — Final report

**Status: COMPLETE.** Batches 1-8 are done and verified; Batch 9 is postponed by design
(section 5), and the remaining gaps are named rather than implied.

This file was written as the work proceeded, per the standing instruction to keep
modernization documentation current rather than retrospective. Every number here was
measured; nothing is estimated. Where a later measurement contradicted an earlier claim of
mine, the correction is stated in place rather than quietly edited out — there are four of
them, and they are the most useful thing in this document.

**Final gate state:** `tsc --noEmit` 0 errors under `strict: true` · `npm run lint` exit 0 at
`--max-warnings=0` · **78 tests / 24 files** · `npm run build` exit 0 · **189/195 frames
pixel-identical, 0 unintended visual regressions**.

**Two things need a human before this ships:** delete the dead `Field` primitive (D15 — the
sandbox correctly refused to delete untracked files), and check the image-host reachability
described at the end of section 6.

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
| `npm test` | 59/59 | **78/78** (24 files) |
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

Batches 1–8 are **complete**. What follows is what is genuinely left.

1. **Delete the dead `Field` primitive.** `src/components/ui/field.tsx` and its test have zero
   call sites and are untracked. Verified dead against the Phase 8 rule (no dynamic specifier
   anywhere in `src` could reach it). The deletion was attempted and refused by the sandbox's
   irreversible-destruction guard, since untracked files are unrecoverable — it needs a human
   `rm`. See **D15**. Do this *before* the next commit, because `git add -A` would otherwise
   commit dead code.
2. **Browser-verify the authenticated flows.** Everything reachable without a session has been
   exercised; checkout, account, admin and the doctor portal have not. This is the single
   largest gap in verification and it is **blocked on credentials**, not on engineering.
   It matters most for `checkout-page.tsx`, which had its pending-state management rewritten
   onto `useTransition` in Batch 8 and is verified only by typecheck, lint, tests and build.
3. **The `set-state-in-effect` rule is still `'off'`** at 3 warnings. Those 3 are legitimate
   and must stay; turning the rule on would require three suppressions. Revisit only if React
   ships a way to express "this effect really is an external-system read".
4. **`@next/next/no-img-element` is still `'off'`** for the 3 documented `<img>` exceptions.
   Two could be resolved by learning the real intrinsic dimensions of the images involved.

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

### A deployment risk this run surfaced — please check before deploying

`raiyansoft.com`, which hosts the encyclopedia thumbnails, book covers and the site logo,
**returns 403 to every server-side client from this machine** — with no headers, with a browser
User-Agent, and with a referer. So the image host could not be reached at all here, and both
builds render those images broken.

That matters because of *how* the two builds fetch them:

- Baseline: `<img src="https://raiyansoft.com/...">` — fetched **by the visitor's browser**.
- Current: `next/image` → `/_next/image?url=...` — fetched **server-side by the Next.js image
  optimizer**, then re-served.

WordPress hosts commonly apply hotlink protection or block datacenter IP ranges. If the
production server cannot reach `raiyansoft.com` the way a visitor's browser can, images that
work today would break after this change — and this environment could not distinguish the two
cases, because it cannot reach the host either.

**Before deploying, run this from the production/preview host:**

```
curl -sI https://raiyansoft.com/wp-content/uploads/2026/04/n1.webp
```

A `200` means the migration is safe as-is. A `403`/`404` means the images from that host need
`unoptimized` on their `<Image>` (which keeps the layout and lazy-loading while letting the
browser fetch the original URL directly), or should revert to `<img>`. This is the one change
in this pass whose production behaviour could not be verified locally.

---

## 7. Recommended next steps

1. **Add CI.** There is none today, so every gate in section 4 depends on someone
   remembering to run it. This is the cheapest change with the most durable payoff: the
   modernization's value decays the moment `strict: true` and a clean lint can be broken
   without anyone noticing.
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
