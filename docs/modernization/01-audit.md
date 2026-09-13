# 01 — Audit (consolidated)

Roll-up index for the seven detailed audit documents. Individual findings live in
the per-area files, each using the standard finding block
(`Issue / Location / Severity / Why it matters / Current behavior / Recommended
solution / Risk / Verification method / Status`). This file exists to give the
single ranked view, to record **cross-audit contradictions and how they were
resolved**, and to avoid restating ~180 findings in two places.

| Area | Document | P0 | P1 |
| --- | --- | --- | --- |
| Data fetching / TanStack Query | [audit-data-fetching.md](audit-data-fetching.md) | 1 | 1 |
| React correctness & architecture | [audit-react.md](audit-react.md) | 2 | 4 |
| Next.js architecture | [audit-nextjs.md](audit-nextjs.md) | 0 | 6 |
| TypeScript type safety | [audit-typescript.md](audit-typescript.md) | 4 | 7 |
| UI / accessibility / performance | [audit-ui-a11y-perf.md](audit-ui-a11y-perf.md) | 0 | 4 |
| Hardening | [audit-hardening.md](audit-hardening.md) | 0 | 2 |
| Backend API delta | [backend-api-delta.md](backend-api-delta.md) | n/a | n/a |

Baseline these are measured against: [00-project-baseline.md](00-project-baseline.md).

---

## Cross-audit reconciliations

Parallel agents disagreed in three places. Resolved here, by me, against the actual
files — the corrections matter more than the raw findings.

**1. "No `middleware.ts` exists" — WRONG.** The data-fetching audit asserted there
was no middleware to hold a server-side credential. `src/middleware.ts` did exist
and did gate routes server-side (now migrated to `src/proxy.ts`). The real defect is
not its absence but that it trusts a client-written cookie value — see HARD-001.
The data-fetching audit's *conclusion* (server prefetch is currently impossible for
authenticated routes) still holds, because the token lives in `localStorage`; only
its stated reason was wrong.

**2. Token-in-localStorage severity: P0 vs P2.** The data-fetching audit rated it
P0; the hardening review rated it P2. **Resolved as P1, tracked jointly with
HARD-001.** Rationale: it is not independently exploitable (the backend authorizes
every request on its own), so it is not P0; but it is more than a hygiene issue,
because it is the single thing structurally blocking the server-first architecture
the project has already committed to in `AGENTS.md`. One fix — an httpOnly session
cookie issued by the Laravel API — resolves the authorization defect and unblocks
SSR credentials simultaneously. They must be planned as one change, not two.

**3. Raw `<img>` count: 26 vs 25.** The Next.js audit found 25, the UI audit 26.
The difference is one occurrence inside a test string. **25 in shipped JSX.** Either
way `next/image` is imported nowhere, despite four `remotePatterns` already
configured in `next.config.ts`.

**5. `AIChatWidget` — "dead" vs "ships `motion` to every route". Both true, different files.**
The React audit listed `components/AIChatWidget.tsx` as having zero imports; the UI
audit reported `AIChatWidget` rendering unconditionally from root `Providers`. There
are **two** components with that name:
- `./components/AIChatWidget.tsx` (repo root, legacy) — **zero importers, genuinely dead.**
- `src/features/ai-assistant/components/ai-chat-widget.tsx` — **live**, mounted in
  `src/app/providers.tsx`, and the one pulling `motion` into every route.

Batch 7 deletes the first; Batch 8 lazy-loads the second. Confirmed by reading
`providers.tsx` and grepping importers. Getting this backwards would delete a live
feature, which is exactly why the live/dead split is verified per-file rather than
per-name.

Also confirmed while reading `providers.tsx`: it does mount `BlogProvider`,
`ResearchProvider`, `TheoryProvider` and `CourseCommentProvider` — the four
zero-consumer contexts — so the Batch 7 target list is accurate.

**4. `radix-ui` usage: "0 importers" — my own false negative.** An early grep of
mine used single-quoted import patterns and missed three double-quoted ones. The
`radix-ui` meta package **is** used (`scroll-area.tsx`, `popover.tsx`,
`dialog.tsx`). The genuinely unused packages were the three individual
`@radix-ui/react-{dialog,dropdown-menu,tabs}` deps.

---

## P0 — Critical

| # | Finding | Location | Source |
| --- | --- | --- | --- |
| 1 | Rules-of-Hooks violation: early return ahead of 16+ `useState` calls, and `navigate()` called during render | `src/features/account/components/settings-page.tsx:19-22` | react |
| 2 | Podcast restore effect ref-locks before auth hydrates, silently wiping saved playback for signed-in users | `src/features/podcasts/components/podcast-player-provider.tsx:49-66` | react |
| 3 | `apiFetch<T>()` blind-casts every network response with zero runtime validation | `src/lib/api/base-fetch.ts:142,145` | typescript |
| 4 | GDPR erasure path reads 10 storage keys as `any[]` and filters on `.userId` with no shape check | `src/features/auth/auth-provider.tsx` | typescript |
| 5 | Two incompatible `SubscriptionPlan` interfaces share one name across features | `src/features/business/business.types.ts:42` vs `src/features/subscriptions/types/api.types.ts:18` | typescript |
| 6 | `tsconfig` `strict: false` — no `strictNullChecks`, no `noImplicitAny` | `tsconfig.json` | typescript |

#1 and #6 are the two I verified personally by reading the files. #1 is invisible to
tooling only because `react-hooks/rules-of-hooks` is disabled in eslint — a direct
consequence of the disabled-rules decision recorded in the baseline.

## P1 — High

**Architecture root cause (fix this and several others collapse):**

| Finding | Location |
| --- | --- |
| `next-router-compat.tsx` is a React-Router-shaped shim using client `useParams()`/`useSearchParams()`, so no `page.tsx` ever receives server `params`. This is *why* 90/94 pages are `'use client'`, why 0/94 export metadata, and why only 1/94 server-prefetches. | `src/lib/routing/next-router-compat.tsx` |

**Everything else P1:**

| Finding | Location | Source |
| --- | --- | --- |
| `b3_session` cookie is a client-writable role string; proxy gates `/admin` + `/doctor` on `===` against it | `src/proxy.ts:6-21`, `src/features/auth/auth-storage.service.ts:120` | hardening |
| Auth token in `localStorage` blocks SSR credentials (see reconciliation 2) | `src/lib/api/base-fetch.ts:67` | data-fetching + hardening |
| 10 high-severity transitive advisories (undici, ws) | `package-lock.json` | hardening |
| `AuthContext` value is a fresh object with ~20 unmemoized functions per render, wrapping nearly the whole app | `src/features/auth/auth-provider.tsx:382-407` | react |
| `checkout-page.tsx` — 814 lines, `item: any`, 7 product types inlined, 240-line `confirmPayment` | `src/features/checkout/components/checkout-page.tsx` | react |
| Duplicated hand-rolled address forms instead of the project's own react-hook-form + zod convention | checkout-page.tsx, settings-page.tsx | react |
| `addresses` held as both effect-synced query state and independent local state | `src/features/account/components/settings-page.tsx` | react |
| Only 1 of 94 `page.tsx` implements server prefetch + `HydrationBoundary` | `src/app/**` | data-fetching |
| Zero `error.tsx` anywhere — no error boundary on any route | `src/app/**` | nextjs |
| 0 of 94 pages export `metadata`/`generateMetadata` | `src/app/**` | nextjs |
| Leaf components marked `'use client'` with zero hooks | `BookCard.tsx`, `admin-page-header.tsx` | nextjs |
| 25 raw `<img>`; `next/image` imported nowhere | `src/**` | nextjs + ui |
| `FormFieldError` has zero consumers; ~28 files hand-roll field errors with no `aria-invalid`/`aria-describedby` | `src/components/feedback/feedback.tsx:6` | ui |
| Shared `Input`/`Label` have no `aria-invalid` support; `htmlFor` used once in the codebase | `src/components/ui/{input,label}.tsx` | ui |
| Icon-only buttons largely unlabeled (16 `aria-label` + 2 `sr-only` across 60 lucide-importing files; `size="icon"` used 0 times) | `src/**` | ui |
| `LanguageContext.tsx` (72 KB) + 5 root contexts ship globally to every route | `src/app/providers.tsx` | ui |
| `zod` installed and proven in forms, never used at the API boundary | `src/lib/api/**` | typescript |
| `CareBooking` / `CareBookingDetail` / `CareBookingListItem` / `BookingResult` / `InitialConsultationTypes` byte-identical across clinic/trips/consultations | `src/features/{clinic,trips,consultations}` | typescript |
| Root `types.ts` duplicates `User`/`Course`/`Book`/`Booking`, still imported by 37+ files | `types.ts` | typescript |
| `readLocalStorageJson<T>()` is `JSON.parse(raw) as T`, unvalidated | `src/lib/storage/**` | typescript |
| Mutation endpoints skip the defensive mapping GET endpoints use | checkout, quiz-submit | typescript |
| Non-null assertion hiding a real `never`-collapse (TS2339) | `care-records-storage.service.ts:211` | typescript |
| 11 unguarded `user` accesses (TS18047 under strictNullChecks) | `checkout-page.tsx` | typescript |

## P2 / P3

Held in the per-area documents. The notable clusters:

- 27 of 70 `*.service.ts` files carry a pointless `'use client'`.
- Zero `loading.tsx`; no `sitemap.ts` / `robots.ts`; no `generateStaticParams`
  anywhere, so catalog detail routes are all dynamic.
- Dark mode inert — 18 `dark:` classes, no `@theme`, no provider, no toggle.
- 9 files hand-build `fixed inset-0` modals while `ui/dialog.tsx` sits unused.
- `AdminShell` and `AdminPageHeader` both render `<h1>{title}</h1>` — duplicate h1 risk.
- `AIChatWidget` renders unconditionally from root `Providers`, pulling `motion`
  into every route's bundle. Zero `next/dynamic` usage in the app.
- Newsletter management silently falls back to a fake localStorage OTP flow with a
  hardcoded `'123456'` when its backend query errors.
- Dead weight: 4 root contexts mounted with zero consumers; 5 root files with zero
  imports at all. Full live/dead split in the baseline.
- `.env` tracked by git (contains only the public API URL — nothing exposed).

## Confirmed clean

Recorded so later work doesn't "fix" what isn't broken:

- **Fonts** — 100% `next/font`, no CLS risk.
- **Caching** — Next 16's uncached-`fetch` default is in effect; no `cacheComponents`,
  no stale-data risk found.
- **The fetch client** — `ApiError` handling, global `QueryCache`/`MutationCache`
  toast wiring, `staleTime`/`retry` defaults and `placeholderData: keepPreviousData`
  all match current TanStack v5 practice and `.cursor/react-query.md`.
- **No `useEffect`-fetches-data anti-pattern anywhere** in the codebase.
- **Untrusted HTML** — the single `dangerouslySetInnerHTML` is DOMPurify-sanitized
  with an explicit safe profile.
- **Environment variables** — exactly one exists, correctly `NEXT_PUBLIC_`.
- **Redirects** — every target is a hardcoded internal literal; no open-redirect surface.
- **Async `params`** — no page reads `params` as a prop at all, so Next 16's
  Promise change cannot break anything (a side effect of the router-shim problem).
- **`strictFunctionTypes`, `strictBindCallApply`, `noImplicitThis`,
  `useUnknownInCatchVariables`, `alwaysStrict`** — measured at 0 errors each.

## Deferred by project decision

`AGENTS.md` explicitly defers i18n and RTL work. Recorded, not scheduled:
`lang="ar" dir="rtl"` is hardcoded in the root layout and never follows
`LanguageContext`. No i18n overhaul is proposed here.

---

## Vercel React best-practices Skill audit (added late — see D11)

The first audit pass was done without the `vercel-react-best-practices` Skill loaded.
After the user asked whether the frontend had actually been run against it, the Skill was
loaded and the codebase was audited against **all 70 rules across all 8 categories**, by
four agents split by category, each required to read the rule files from disk, cite exact
rule ids, and enumerate rules with *no* violations so coverage is provable rather than
implied.

| Report | Categories | Rules |
| --- | --- | --- |
| `audit-vercel-waterfalls-bundle.md` | `async-`, `bundle-` | 12 |
| `audit-vercel-server-client.md` | `server-`, `client-` | 14 |
| `audit-vercel-rerender-rendering.md` | `rerender-`, `rendering-` | 26 |
| `audit-vercel-js-advanced.md` | `js-`, `advanced-` | 18 |

### What the Skill found that the first pass had missed

Three things, and they are the justification for the whole re-run:

1. **A P0 bundle defect with a measured size.** `AIChatWidget` — a floating overlay
   importing `motion/react` — was statically mounted in the single root layout, so its
   **54,355-byte** chunk shipped to all 94 routes. The first pass never looked at chunk
   composition at all. **FIXED and verified** (see below).
2. **A live privacy bug**, via `client-localstorage-schema`: account-deletion
   anonymization targeted `'b3-payments-records'` while the store writes
   `'b3-payment-records'`, so payment PII survived account deletion. **FIXED.** The same
   rule then surfaced 9 further user-data keys that deletion never touches — an owner
   decision, recorded in `audit-hardening.md`.
3. **A missing cross-origin connection hint** (`rendering-resource-hints`): ~90 of 94
   pages fetch from `portal.b3.raiyan.cc` on mount, and because the app is almost
   entirely client-rendered those fetches cannot begin until after hydration — so the
   TCP+TLS handshake was paid serially on the critical path of the first real request.
   **FIXED and verified.**

### Coverage: rules confirmed clean

Reported as clean with stated evidence, not by omission — including several where the
tempting answer was to invent a violation:

- `rerender-no-inline-components` — 0 found, verified with a detector script that was
  sanity-checked against a known nested helper to prove the detector actually works.
- `rendering-conditional-render` — all **96** `&&`-in-JSX occurrences were audited;
  **0** have a numeric or `.length` left operand, so none can produce the `0`/`NaN`
  render bug. Reported as informational (prefer ternaries in new code), not a violation.
- `async-parallel`, `async-dependencies`, `async-defer-await`,
  `async-cheap-condition-before-await` — clean. `books/page.tsx` already uses
  `Promise.all` for its two independent `prefetchQuery` calls.
- `async-api-routes` — **no surface**: `src/app/api/` is deleted and there are zero
  `'use server'` actions.
- `rerender-lazy-state-init`, `rerender-memo-with-default-value`,
  `rerender-use-ref-transient-values`, `rerender-use-deferred-value`,
  `rerender-transitions`, `rerender-split-combined-hooks`,
  `rendering-script-defer-async`, `rendering-svg-precision`, `rendering-hoist-jsx`,
  `rendering-hydration-no-flicker`, `rendering-hydration-suppress-warning` — clean.
- `lucide-react` barrel imports (57 files) — already covered by Next's default
  `optimizePackageImports` list, confirmed by reading the list in `node_modules`.

### Resolved during this pass

| Rule | Finding | Resolution |
| --- | --- | --- |
| `bundle-dynamic-imports` | P0 — 54,355 B widget chunk on all 94 routes | **Fixed & verified.** Widget body is now a chunk with **0** server-route references; the 95-route shared chunk keeps only the `dynamic()` stub. |
| `rendering-resource-hints` | P1 — no API `preconnect` | **Fixed & verified.** Present in `<head>` of **66/67** prerendered pages; the one exception is `_global-error.html`, which replaces the root layout by design. |
| `client-localstorage-schema` | Payment PII survived account deletion | **Fixed.** Key corrected, with a comment naming the module it must stay in sync with. |
| `bundle-barrel-imports` | P1 — `radix-ui` barrel not in `optimizePackageImports` | **Not applicable.** Turbopack does this automatically; see **D12**. No config change. |
| `bundle-conditional` (assistant) | P0 — flag checked after the module loads | **Downgraded to P3.** See reasoning below. |
| ESLint rule counts | Audit said 16 warnings, my note said 15 | **Audit was right.** Re-measured: 16, all `set-state-in-effect`. `purity` is clean and is now `'error'`. See **D13**. |

**Why `bundle-conditional` on the assistant is now P3, not P0.** The finding paired two
costs: the chunk sits on the critical path *and* it loads even when the feature is off.
The dynamic import removed the first, which was the dominant one — it affected every
visitor. The residual cost only materialises where an admin has disabled the assistant,
and `getAssistantConfig()` **seeds `enabled: true`** when nothing is stored, so the
default is on. Fully closing it means reading the flag in `providers.tsx`, which would
either drag `assistant-config.service.ts` back into the shared bundle (self-defeating —
it is the module the 54 KB chunk was measured by) or duplicate the storage key and its
default in a second place. Duplicating a storage key is the exact defect class that
caused the payment-PII bug above. Deferred deliberately, not overlooked.

### Still open from the Skill audit

**P1**

- `rerender-derived-state-no-effect` — `CourseCheckoutPage.tsx:32-42,63-65`: four chained
  effects correcting `orderType`/`courseSectionId` that should be derived during render.
- `rendering-usetransition-loading` — `checkout-page.tsx`: `isProcessing` is reset from 8
  scattered call sites in the payment-confirmation flow. A real stuck-spinner risk.
- `bundle-conditional` — `LanguageContext.tsx`: all four locales' strings in one
  **68,500-byte** chunk on every route; ~75% unused per session. Tracked in Batch 8.
- `async-suspense-boundaries` — structurally unavailable on 90/94 routes because the
  router-compat shim forces them client-side. Same root cause as the postponed Batch 9;
  the recently-added `loading.tsx`/`error.tsx` mask JS-download latency, **not**
  data-fetch latency, so they are not a substitute.

**P2**

- `rerender-defer-reads` — `LanguageContext` and `CurrencyContext` provider values are
  unmemoized across ~94 consumers. This is the same fix `AuthProvider` already received
  in Batch 2, so the pattern is proven here.
- `rerender-derived-state-no-effect` — `CooperationPage`, `course-player` (×2),
  `newsletter-page`, `ai-chat-widget` language reset, `favorite-toggle-button` (the audit
  recommends `key` at its 6 call sites rather than an effect).
- `rerender-memo` — `CourseCheckoutPage` computes its price label before its own loading
  early-return.
- `bundle-dynamic-imports` — `phone-input.tsx` eagerly loads ~250 country flag SVGs and
  the `cmdk` Command primitives for a popover that starts closed. The audit explicitly
  declined to state a byte figure here, because the two candidate chunks are referenced
  from all route manifests and that signature is not proof of global shipping.

**P3** — functional-setstate (2 sites), one over-memoized static array (flagged *against*
over-memoizing), a narrow-dependency `useCallback([user])` in `auth-provider`,
`animate-spin` applied directly to SVG icons at 11 sites (`rendering-animate-svg-wrapper`
prefers animating a wrapper), and the `Activity`-vs-`AnimatePresence` tradeoff on the chat
widget.

---

## RACE-001 — API response language depended on React effect ordering

```
Issue:                The Accept-Language header was omitted from the first client-side API
                      requests of a page load, so the backend answered in its own default
                      ('en') on a site whose <html lang> is hardcoded "ar". Whether the
                      header was present depended purely on effect ordering.
Location:             src/lib/api/base-fetch.ts (getStoredLanguage), racing against
                      LanguageContext.tsx's mount effect that writes STORAGE_KEYS.language
Severity:             P1
Status:               FIXED and verified
```

**How it was found.** Not by reading code — by the Phase 6 visual regression. `/books` was
the one route out of 195 frames that differed **reproducibly and in one direction**
(154 px shorter at 375 px, ~0.22% of pixels at 1440 px). Everything else was either
pixel-identical or flipped between runs.

**Ruling things out, in order.** Each of these was a plausible answer that turned out to be
wrong, and each was discarded on evidence rather than argument:

1. *Backend flakiness*, like the other two differing frames — ruled out: `/books` never
   flipped across repeated interleaved runs.
2. *The Next.js version gap.* The two builds were genuinely on different versions (both
   declare `^16.2.9`; the `npm audit fix` lockfile bump resolves to **16.3.4** vs the
   baseline's **16.2.9**), and `/books` is the only route using server `prefetchQuery` +
   `HydrationBoundary`. Next 16.3.4 was installed into the baseline worktree with its code
   untouched and the baseline rebuilt — **the difference persisted**.
3. *Build-time data drift*, since `/books` is `○ (Static)` and its prefetched payload is
   frozen at build time. Ruled out by rebuilding the baseline from scratch: it **still**
   prerendered English.
4. *The books code changed in this pass.* Ruled out — the only functional edit
   (`isFavorited`) is in `getApiBookDetail`, which serves the detail page, not this
   catalogue.

**The actual cause.** A DOM-level comparison showed both builds rendering identical
structure — 8 buttons, 7 images, 28 grid items, identical image sources — differing *only*
in book titles: English in the baseline, Arabic in the current build. Both builds
**prerender English**, so the divergence happens after hydration. Capturing request headers
made it unambiguous, 3/3 runs each from a fresh browser profile:

| Build | `b3_lang` after load | `Accept-Language` on the book fetches | Titles rendered |
| --- | --- | --- | --- |
| baseline | `ar` | **(none), (none)** | English |
| current | `ar` | **ar, ar** | Arabic |

`LanguageProvider` writes the language key from a **mount effect**, and React runs effects
child-first, so a page's data fetches can be issued *before* that write lands.
`getStoredLanguage()` returned `undefined` in that window, the header was dropped, and the
backend replied in English. Unrelated timing changes in this pass — the `AIChatWidget`
dynamic import removing a component from the hydration tree, and the memoised providers —
shifted mount ordering enough to flip the race the other way.

So the "regression" was the visual harness catching a **pre-existing latent bug**. The
current build's Arabic output is the *correct* result, but it was only accidentally correct.

**Fix.** `getStoredLanguage()` now falls back to the app's default language instead of
`undefined`, so the header no longer depends on whether an effect has run. It also now reads
`STORAGE_KEYS.language` rather than a second hardcoded `'b3_lang'` literal — a duplicated
storage key being precisely what let payment PII survive account deletion.

**Verification.** Four new tests in `src/lib/api/base-fetch.test.ts`, and the key one was
confirmed to actually catch the bug: with the fix temporarily reverted it fails with
`expected null to be 'ar'` while the other six stay green. In the browser, the current build
now sends `Accept-Language: ar` on 3/3 runs and renders Arabic titles.

### Related, still open — prerendered pages are in the wrong language

This is the note referenced from the comment in `base-fetch.ts`. `getStoredLanguage()`
deliberately still returns `undefined` **on the server**, because there is no user there to
read a preference from. The consequence is that `/books` — the only server-prefetching route
— is **prerendered in English** and then swaps to Arabic after hydration.

That is a real defect with two costs: a visible content flash on first paint, and crawlers
receiving English content for a document declaring `lang="ar"`. The fix is to send the
default UI language on the server as well, so the prerender matches what the user ends up
seeing. It is **not** done here because it changes prerendered output for a
search-indexable page, which is a content decision rather than a cleanup, and it deserves
its own visual verification pass. Left as an owner decision.
