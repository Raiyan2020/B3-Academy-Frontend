# React Correctness & Architecture Audit

Read-only audit. No source files were modified. Scope: `src/app/`, `src/features/*` (27 features), `src/components/`, `src/lib/`, plus the root-level legacy files outside `src/`.

Context: ESLint has `react-hooks/rules-of-hooks`, `react-hooks/set-state-in-effect`, `react-hooks/purity`, `@typescript-eslint/no-unused-vars`, and `@typescript-eslint/no-explicit-any` disabled (`eslint.config.mjs:12-19`). This document is what stands in for those rules.

Convention baseline used to grade findings: `AGENTS.md`, `.cursor/architecture.md` (regular-function components, one component per file, feature folders with `components/hooks/services`), `.cursor/components.md` ("If a component exceeds 200 lines, it MUST be broken down").

---

## 0. Root-level legacy files — live vs dead (verified by import grep)

| File | Status | Evidence |
|---|---|---|
| `LanguageContext.tsx` (72KB) | **LIVE** | Mounted as `<LanguageProvider>` in `src/app/providers.tsx:3,17`. Imported via relative path by **94 files** across `src/**` (`useLanguage`/`t`/`localize` used everywhere). |
| `CurrencyContext.tsx` | **LIVE** | Mounted in `src/app/providers.tsx:4,18`. Imported by **12 files** (e.g. `src/features/checkout/components/checkout-page.tsx:6`). |
| `types.ts` | **LIVE** | Canonical domain types (`User`, `Address`, `Course`, `Blog`, `LocalizedString`, …). Imported by **30+ files**, mostly via feature `types/*.types.ts` barrel re-exports (e.g. `src/features/auth/types/auth.types.ts:1-2`). |
| `data.ts` | **LIVE** | Re-exported by 5 feature mock-data files: `src/features/{books,consultations,courses(x2),library}/data/*.mock.ts`, which feed feature services. |
| `components/UI.tsx` | **LIVE** | Exports `Button`, `SectionHeader`, `CourseCard`, `BookCard`. Imported via `../../../../components/UI` by **9 feature files** (`settings-page.tsx:3`, `auth-page.tsx:5`, `checkout-page.tsx:4`, `clinic-booking-detail.tsx:9`, `consultation-detail.tsx:8`, `health-assessment-form.tsx:6`, `health-assessment-page.tsx:6`, `quiz-player.tsx:8`, `about-page.tsx:5`, `home-page.tsx:10`). See §8 for the duplication this causes against `src/components/ui/button.tsx`. |
| `components/Graphics.tsx` | **LIVE** | Decorative SVG components (`MushroomGraphic`, `HempLeafGraphic`, etc.), imported by 4 `site-content` pages. |
| `BlogContext.tsx`, `ResearchContext.tsx`, `TheoryContext.tsx`, `CourseCommentContext.tsx` (118/118/118/97 lines) | **MOUNTED BUT FUNCTIONALLY DEAD** | Each is mounted as a provider in `src/app/providers.tsx:5-8,20-23` (so its state/effects execute on every page load, and each provider's context `value` object is recreated every render — see §5), but `grep -rn "useBlogs\|useResearches\|useTheories\|useCourseComments" src` returns **zero matches**. No component anywhere in `src/**` consumes these contexts. They are pure dead weight in the render tree. |
| `components/Layout.tsx` (556 lines), `components/QuizPlayer.tsx` (216), `components/HealthAssessmentForm.tsx` (414), `components/AIChatWidget.tsx` (1, re-export shim) | **DEAD** | Zero imports from `src/**` at any relative depth. Fully superseded by `src/features/navigation/components/site-layout.tsx`, `src/features/learning/components/quiz-player.tsx`, `src/features/health-assessment/components/health-assessment-form.tsx`, `src/features/ai-assistant/components/ai-chat-widget.tsx`. Safe to delete. |
| `services/geminiService.ts` (1 line) | **DEAD** | Zero references anywhere in `src/**` or the repo (`grep -rn "geminiService"` → no hits). Orphaned stub. |

**Verdict:** the migration is *not* finished. `LanguageContext`/`CurrencyContext`/`types.ts`/`data.ts`/`components/UI.tsx`/`components/Graphics.tsx` are load-bearing production code, not leftovers — treat their eventual migration into `src/` as a real, high-blast-radius project. `Blog/Research/Theory/CourseCommentContext` and root `Layout/QuizPlayer/HealthAssessmentForm/AIChatWidget.tsx` and `services/geminiService.ts` are safe, no-consumer deletions.

---

## Findings

### P0

```
Issue:                Component calls hooks conditionally — early return before ~15 hooks
Location:             src/features/account/components/settings-page.tsx:13-22 (guard), 24-69 (hooks called after it)
Severity:             P0
Why it matters:       Violates the Rules of Hooks. On first render, `user` is often still null (AuthProvider hydrates it from localStorage inside a useEffect — src/features/auth/auth-provider.tsx:84-98 — which runs asynchronously relative to Settings' own render). Settings renders, hits `if (!user) { navigate('/auth'); return null; }` at line 19-22, and stops after calling only 4 hooks (useAuth, useNavigate, useBackendAddresses, useBackendAddressActions). Once AuthProvider's effect resolves and `user` becomes non-null, Settings re-renders and this time falls through the guard, calling 13 additional useState hooks (lines 24-55) and 2 useEffect hooks (lines 57-69) that were never called on the prior render. React requires the same hooks in the same order on every render; this mismatch throws "Rendered more hooks than during the previous render" (React error #310) or silently corrupts hook state, depending on timing.
Current behavior:     
                         const backendAddressActions = useBackendAddressActions();

                         if (!user) {
                             navigate('/auth');
                             return null;
                         }

                         const [name, setName] = useState(user.name);
                         ...  // 12 more useState + 2 useEffect below this line
Recommended solution:  Call every hook unconditionally at the top of the component. Guard the *render output*, not the hooks: keep all `useState`/`useEffect` calls above any early return, and derive `name`/`email`/etc. from `user` with a null-safe fallback (`user?.name ?? ''`) or gate the JSX return (not the hook calls) on `!user`. Also move `navigate('/auth')` into a `useEffect` — calling a router navigation as a side effect during render is itself impure (see P1 below); RequireAuth (src/features/auth/components/require-auth.tsx) already shows the correct pattern (effect-gated redirect + hooks called unconditionally before its own `if (!user) return <...>`).
Risk:                  Low — reordering existing hooks above the guard and switching to optional-chained defaults does not change behavior for the authenticated path.
Verification method:   Load `/dashboard/settings` cold (no cached user), or throttle localStorage/first paint, and watch for React error #310 in the console; alternatively add `console.log` hook-call counts per render in dev and confirm they differ between the two renders described above.
Status:                Open
```

```
Issue:                Race condition: podcast playback restoration runs before auth state hydrates, then is permanently skipped
Location:             src/features/podcasts/components/podcast-player-provider.tsx:49-66
Severity:             P0
Why it matters:       `PodcastPlayerProvider` is mounted as a descendant of `AuthProvider` in src/app/providers.tsx (AuthProvider > ... > PodcastPlayerProvider). React runs child effects before parent effects on initial mount, so this provider's restore-effect (line 49) fires while `user` (from `useAuth()`, line 35) is still its initial `null` — before AuthProvider's own effect (auth-provider.tsx:84-98) has hydrated it from storage. `accessContext` (line 41-47) is therefore `{isAuthenticated: false, isSubscribed: false}` on this first run. If the saved podcast requires access, `canAccessPodcast` fails and `clearPlaybackState()` wipes the saved position (line 56) for a user who actually is logged in. `restoredRef.current` is set `true` unconditionally on this first run (line 51), so when `accessContext` later updates correctly (after AuthProvider hydrates and this effect's `[accessContext]` dependency changes), the ref guard blocks the effect body from ever running again — the correct restoration never happens.
Current behavior:     
                         useEffect(() => {
                           if (restoredRef.current) return;
                           restoredRef.current = true;
                           const saved = getPlaybackState();
                           if (!saved) return;
                           const podcast = getPodcastById(saved.podcastId);
                           if (!podcast || !canAccessPodcast(podcast, accessContext)) {
                             clearPlaybackState();
                             return;
                           }
                           ...
                         }, [accessContext]);
Recommended solution:  Don't gate on a ref that's set on the very first (possibly-unauthenticated) run. Either (a) wait for auth to finish loading before attempting restoration — expose an `isLoading`/`isReady` flag from AuthProvider and skip the effect body until it's true, or (b) drop the ref guard and instead make the effect idempotent (bail out if `currentPodcast` is already set), relying on `[accessContext]` to naturally re-run once when the real user loads and settle after that.
Risk:                  Low-medium — only affects the cold-load restore path; playback itself is unaffected.
Verification method:   Log in, start a podcast, reload the page with network throttled so the localStorage-based auth hydration is observably delayed; confirm the mini-player does not reappear.
Status:                Open
```

### P1

```
Issue:                AuthContext provider value is a fresh object with ~20 unmemoized functions every render
Location:             src/features/auth/auth-provider.tsx:382-407 (value object), 117-380 (17 inline function definitions, none wrapped in useCallback except requireAuthAction at 104-115)
Severity:             P1
Why it matters:       AuthContext wraps almost the entire app (src/app/providers.tsx:4) and `useAuth()` is consumed by dozens of components. Every AuthProvider render (triggered by its own `user`/`isAuthModalOpen`/`pendingAction` state, or by a `language` change since it also calls `useLanguage()` at line 79) produces a brand-new `value` object and brand-new function identities for `login`, `register`, `logout`, `updateProfile`, `purchaseItem`, etc. Any consumer wrapped in `React.memo`, or any consumer that puts one of these functions in a `useEffect`/`useCallback` dependency array, re-renders or re-runs unnecessarily on every AuthProvider render, even if it only needed a value that didn't change (e.g. `logout`).
Current behavior:      `return (<AuthContext.Provider value={{ user, login, register, ... requireAuthAction }}>`  — object literal + 16 non-memoized function expressions, reconstructed every render.
Recommended solution:  Wrap the stable action functions in `useCallback` (most only close over `user`/`language`, both already in deps elsewhere) and wrap the provider `value` in `useMemo` keyed on `user`, `isAuthModalOpen`, `requireAuthAction`. Given the size, splitting into a "state" context (`user`, `isAuthModalOpen`) and an "actions" context (stable functions, memoized once) would let most consumers subscribe to only what they need.
Risk:                  Low — useCallback/useMemo wrapping is behavior-preserving as long as dependency arrays are correct; verify closures over `user`/`language` are captured correctly.
Verification method:   React DevTools Profiler: record a session that opens the auth modal or toggles language, and confirm which consumers of `useAuth()` re-render vs. which actually needed to.
Status:                Open
```

```
Issue:                `checkout-page.tsx` is an 814-line component mixing seven purchase-type business flows with UI
Location:             src/features/checkout/components/checkout-page.tsx (814 lines total); item-resolution switch at 80-122; `confirmPayment` at 288-529 (~240 lines, 6 branches: subscription/course/book/clinic/consultation-session/consultation-package/trip)
Severity:             P1
Why it matters:       Violates `.cursor/components.md` ("If a component exceeds 200 lines, it MUST be broken down") and `.cursor/architecture.md`'s "Container/Presentational" rule (data-heavy logic belongs in hooks/services, not the component). `item` is typed `any` (line 80: `let item: any = null;`) specifically because it has to satisfy 7 unrelated shapes — this is a design smell more than a typing gap, and it means the payment-critical branch logic (price computation, `basePrice`, `fullPrice`, `price` at 200-207) has no compile-time safety at all. `confirmPayment` alone is a 240-line function with 6 near-duplicate localStorage-write blocks, embedded directly in the render body.
Current behavior:      Single `Checkout` component owns: query-param/pending-intent parsing, 7-way item resolution, price/discount/installment math, coupon logic, shipping-address CRUD (state + form), and a 6-way purchase-completion switch — all in one file, one function.
Recommended solution:  Split by product type: one `useCheckoutItem(type, id, format)` hook per product family (or a small resolver table) returning a normalized `{item, price, kind}`; move `confirmPayment`'s per-type completion logic into `features/checkout/services/*` functions (`completeCoursePurchase`, `completeTripPurchase`, …) callable from a thin `handleConfirm`. Extract the address form into a shared component (see duplication finding below) and the coupon block into its own component/hook.
Risk:                  Medium — this is a payment path; any refactor needs equivalent test coverage for all 7 product types before merging.
Verification method:   `find src -name '*.tsx' -exec wc -l {} + | sort -rn | head` before/after; manual purchase-flow smoke test per product type (course full/installment, book ebook/physical, subscription, clinic, consultation session/package, trip).
Status:                Open
```

```
Issue:                Address form state duplicated in local `useState` instead of shared component, and diverges from stated form convention
Location:             src/features/checkout/components/checkout-page.tsx:57-65 (state), 238-249 (save handler), 707-759 (JSX); src/features/account/components/settings-page.tsx:31-39 (state), 104-124 (save handler), 285-307 (JSX)
Severity:             P1
Why it matters:       AGENTS.md states the stack uses `react-hook-form` + `zod` for forms; both address forms instead hand-roll 6 `useState` fields (`name/governorate/area/block/street/building`) with manual required-field checks and no schema validation. The exact same field set, labels, and update-handler shape (`setAddressForm((c) => ({...c, field: value}))`) is implemented twice, independently, so a validation fix or new field in one place silently doesn't apply to the other.
Current behavior:      Two parallel, hand-rolled implementations of "add/edit shipping address" with no shared component or shared validation.
Recommended solution:  Extract a single `AddressForm` component (in `src/components/` or a shared `features/account` service) driven by `react-hook-form` + a `zod` schema, used by both checkout and settings.
Risk:                  Low — UI-only extraction; keep both call sites' current save semantics (checkout writes to local state / user.addresses via `updateAddresses`, settings writes via backend mutation when authenticated).
Verification method:   Manual test: add/edit an address from both Settings and Checkout after the extraction, confirm identical validation and success behavior.
Status:                Open
```

```
Issue:                Settings page keeps two sources of truth for `addresses` (query data synced into local state via effect, plus independent local mutations)
Location:             src/features/account/components/settings-page.tsx:27 (local state), 67-69 (sync effect), 104-142 (guest-path mutations of the same local state)
Severity:             P1
Why it matters:       `addresses` starts from `user.addresses`, is overwritten whenever `backendAddresses.data` changes (line 67-69: `useEffect(() => { if (backendAddresses.data) setAddresses(backendAddresses.data); }, [backendAddresses.data])`), and is *also* mutated directly and independently in `handleAddAddress`/`handleDeleteAddress`/`handleSetDefaultAddress` for the "no API token" guest path (lines 112-138). This is a textbook "state that should be derived, not duplicated" case: whenever a token exists, `addresses` should just be `backendAddresses.data` (or its query's `select`), not a copy kept in sync by an effect that can race with the guest-path local writes.
Current behavior:      `const [addresses, setAddresses] = useState<Address[]>(user.addresses || [])` kept in sync with `backendAddresses.data` via effect, then locally mutated on the guest branch.
Recommended solution:  For the authenticated path, render directly from `backendAddresses.data ?? []` (no local mirror, no effect). Keep local `useState` only for the actual guest/no-token fallback path, and don't reuse the same variable for both.
Risk:                  Low-medium — verify the guest (no-token) address flow, which appears to be a demo/local-only fallback, still works once decoupled from the query-synced value.
Verification method:   Toggle between an authenticated session (token present) and a logged-out/guest session; confirm address list reflects only its respective source in each case.
Status:                Open
```

### P2

```
Issue:                Four dependent useEffects re-derive `orderType`/`courseSectionId` instead of computing them
Location:             src/features/courses/ui/CourseCheckoutPage.tsx:32-34, 36-38, 40-42, 63-65
Severity:             P2
Why it matters:       All four effects exist purely to "correct" state that became invalid once async query data arrived (`supportsSectionPayment`, `supportsFullPayment`, `selectedSection`) — this is exactly the `react-hooks/set-state-in-effect` pattern the audit is standing in for. Each effect firing causes an extra render pass; because they're chained (courseSectionId's validity depends on orderType's validity which depends on query data), a single query resolution can cascade through 2-3 extra renders before the UI settles.
Current behavior:     
                         useEffect(() => {
                           if (!supportsSectionPayment && orderType === 'section') setOrderType('full');
                         }, [orderType, supportsSectionPayment]);
                         useEffect(() => {
                           if (!supportsFullPayment && supportsSectionPayment && orderType === 'full') setOrderType('section');
                         }, [orderType, supportsFullPayment, supportsSectionPayment]);
                         useEffect(() => {
                           if (!isSectionPayment) setCourseSectionId('');
                         }, [isSectionPayment]);
                         // + a 4th at line 63-65 resetting courseSectionId when selectedSection becomes invalid
Recommended solution:  Compute an `effectiveOrderType` directly during render from `orderType` state + the query flags (no effect, no extra state) — e.g. `const effectiveOrderType = !supportsSectionPayment && orderType === 'section' ? 'full' : ...`. Only call `setOrderType`/`setCourseSectionId` from actual user interactions (the `<select onChange>` handlers already at lines 152, 160), not from passive correction effects.
Risk:                  Low — this page has no automated test coverage found; do a manual pass over section-payment-enabled and disabled courses after the change.
Verification method:   Open a course checkout where `supportsSectionPayment` is false; confirm the UI settles in one render (React DevTools "why did this render" / Profiler) instead of 2-3.
Status:                Open
```

```
Issue:                Business logic for account deletion (11 unrelated localStorage domains) is embedded directly in the Auth context provider component
Location:             src/features/auth/auth-provider.tsx:236-318 (`deleteAccount`, ~82 lines, reads/writes 11 separate localStorage keys: health assessments, payments, enrollments, progress, quiz attempts, book purchases, clinic bookings, consultations, trips, favorites, notifications, newsletter)
Severity:             P2
Why it matters:       AGENTS.md: "Services live in `features/[name]/services/`". `deleteAccount` is pure data-layer cleanup with no rendering concern, but lives inline in the context provider component, making the component itself huge (411 lines) and untestable in isolation from React.
Current behavior:      All 11 read/filter/write localStorage blocks are inlined in the component body between lines 236-318.
Recommended solution:  Extract to a `features/account/services/account-deletion.service.ts` function (`purgeUserData(userId)`) that `deleteAccount` calls; the provider keeps only the auth-state transition (`setAccountStatus`, `setUser(null)`).
Risk:                  Low — pure extraction, no behavior change.
Verification method:   Existing account-deletion flow (Settings → Danger Zone) manual test; confirm all 11 storage keys are still purged identically.
Status:                Open
```

```
Issue:                AIChatWidget resets the entire conversation whenever the user's language changes, and schedules an uncancelled focus timer
Location:             src/features/ai-assistant/components/ai-chat-widget.tsx:36-49 (`resetConversation` + effect), 51-56 (`setTimeout` with no cleanup)
Severity:             P2
Why it matters:       `resetConversation` is a `useCallback` keyed on `assistantLanguage` (line 36-45), and `useEffect(() => { resetConversation(); }, [resetConversation])` (line 47-49) re-runs it — wiping `messages` and `inputValue` — every time `assistantLanguage` changes, including mid-conversation. This both (a) resets state via an effect that could just be computed as an initial value, and (b) is a plausible unintended UX bug (switching site language mid-chat silently deletes what the user typed/received). Separately, `setTimeout(() => inputRef.current?.focus(), 300)` at line 54 has no `clearTimeout` in the effect's cleanup, so rapidly toggling `isOpen` or receiving new messages while open can stack multiple pending focus calls.
Current behavior:      See above; effect deps `[isOpen, messages]` at line 56 means the un-cleaned timer is also rescheduled on every new message while open.
Recommended solution:  Only call `resetConversation` from explicit open/close user actions (already done at 189 and in `handleClose` at 58-62) — drop the mount/language-triggered effect, or scope it to true first-mount only. Return `() => clearTimeout(id)` from the focus effect.
Risk:                  Low.
Verification method:   Open chat, type a partial message, switch site language via the language toggle, confirm the draft is not silently lost (or confirm reset-on-language-change is actually the intended UX, in which case just fix the missing timer cleanup).
Status:                Open
```

```
Issue:                `checkout-page.tsx` simulates payment latency with an uncancelled 450ms `setTimeout` holding all purchase-completion logic
Location:             src/features/checkout/components/checkout-page.tsx:292-528 (`window.setTimeout(() => {...}, 450)` inside `confirmPayment`)
Severity:             P2
Why it matters:       If the user navigates away (or the component unmounts) during the 450ms window, the timeout callback still runs and calls `setPaymentError`/`setIsProcessing`/`setIsPurchased` on an unmounted component (React 19 no longer warns for this, but the side effects — `reserveSlot`, `decrementTripSeats`, `addStoredConsultation`, etc. — still execute against storage even though the UI can no longer show the result, and any assumption that "processing" state reflects an in-flight, cancellable operation is false).
Current behavior:      `confirmPayment` is a plain event handler, not wrapped in an effect, so there is no cleanup path at all for the pending timeout.
Recommended solution:  Track the timeout id and clear it if the user navigates away (e.g. via a `useEffect` cleanup keyed on component lifetime), or convert this to a real async mutation (it's simulating a network call) so cancellation is handled by the existing mutation/query layer instead of a bare `setTimeout`.
Risk:                  Low probability (450ms is short) but the side effects it can leave behind (reserved slots, decremented trip seats) are exactly the kind of "silent" bug this category is meant to catch.
Verification method:   Trigger `confirmPayment`, navigate away within 450ms, confirm no console errors and that storage isn't left in an inconsistent state (e.g. seat decremented but no purchase record reachable).
Status:                Open
```

```
Issue:                Two parallel `Button` components: legacy `components/UI.tsx` (root) vs. canonical `src/components/ui/button.tsx`
Location:             root `components/UI.tsx` (imported via `../../../../components/UI` in 9 files, see §0 table); `src/components/ui/button.tsx` (the shadcn primitive AGENTS.md/`.cursor/components.md` designate as canonical)
Severity:             P2
Why it matters:       Two independently-styled/independently-maintained `Button` implementations are live at once. A design change or a11y fix to one won't reach the other; new code has no signal which one to use (both are actively imported today).
Current behavior:      `settings-page.tsx`, `auth-page.tsx`, `checkout-page.tsx`, `clinic-booking-detail.tsx`, `consultation-detail.tsx`, `health-assessment-form.tsx`, `health-assessment-page.tsx`, `quiz-player.tsx`, `about-page.tsx`, `home-page.tsx` all import the legacy `Button`/`SectionHeader`/`CourseCard`/`BookCard` from root `components/UI.tsx` instead of `@/components/ui/*`.
Recommended solution:  Migrate the 9 call sites to `@/components/ui/button` (+ move `SectionHeader`/`CourseCard`/`BookCard` into `src/components/` or the owning feature), then delete `components/UI.tsx`.
Risk:                  Low-medium — visual/behavioral diff between the two Button implementations needs a quick side-by-side check before swapping call sites.
Verification method:   Visual diff of affected pages before/after; grep for `components/UI` imports returning zero results after migration.
Status:                Open
```

```
Issue:                Four context providers mounted app-wide with zero consumers (dead render-tree weight)
Location:             src/app/providers.tsx:5-8, 20-23 (`BlogProvider`, `ResearchProvider`, `TheoryProvider`, `CourseCommentProvider`); root `BlogContext.tsx`, `ResearchContext.tsx`, `TheoryContext.tsx`, `CourseCommentContext.tsx`
Severity:             P2
Why it matters:       Each provider holds its own `useState` array, fetches/saves via `community-content.service` on mount, and (per the same fresh-object-per-render pattern as AuthContext) recreates its context value every render — for zero consumers, on every single page of the app (see §0). This is unconditional dead cost on every request.
Current behavior:      Confirmed via `grep -rn "useBlogs\|useResearches\|useTheories\|useCourseComments" src` → 0 matches.
Recommended solution:  Delete the 4 provider mounts from `providers.tsx` and the 4 root context files, once confirmed no upcoming feature branch depends on them.
Risk:                  Low — no consumers found; grep is exhaustive across `src/**`.
Verification method:   Re-run `grep -rn "useBlogs\|useResearches\|useTheories\|useCourseComments" src` after any pending merges, then delete.
Status:                Open
```

### P3

```
Issue:                `key={index}`/`key={i}`/`key={idx}` used on several mapped lists
Location:             src/components/ui/verification-code-input.tsx:47; src/features/ai-assistant/components/ai-chat-widget.tsx:131; src/features/books/components/book-reader.tsx:203 (chapter select options), 228 (chapter groups); src/features/health-assessment/components/health-assessment-page.tsx:195; src/features/library/components/encyclopedia-detail.tsx:101; src/features/site-content/components/contact-page.tsx:93,114; src/features/site-content/components/faq-page.tsx:52; src/features/site-content/components/home-page.tsx:152,252,281,305
Severity:             P3
Why it matters:       Index keys are only safe when the list is static and never reordered/filtered/spliced. Most of these are effectively static content lists (FAQ items, home-page feature bullets, book chapters) or append-only (chat messages), so actual breakage risk is low today — but they're a latent bug if any of these lists ever become reorderable/filterable, and `book-reader.tsx:203` is a `<select>` with `key={idx}` where a more meaningful stable key (`chapter.pages[0].pageNum`, already used as the `value`) is trivially available.
Current behavior:      See locations above.
Recommended solution:  Replace with a stable id where one already exists in the data (most cases); for genuinely static/never-reordered lists this is optional polish, not urgent.
Risk:                  None (read-only observation).
Verification method:   n/a — code review only.
Status:                Open
```

```
Issue:                Book reader mixes ref-based scrolling with `document.getElementById` string lookups
Location:             src/features/books/components/book-reader.tsx:44-49 (`document.getElementById(\`book-page-${page}\`)`), 171-172 (same pattern in `goToPage`)
Severity:             P3
Why it matters:       `containerRef` (line 34) is declared and passed to the scroll container (line 218) but the actual page-jump logic bypasses it and queries the DOM by id string instead. Works, but two different ways of reaching the DOM for the same feature is unnecessary indirection and harder to keep correct if page ids ever change.
Current behavior:      `const el = document.getElementById(\`book-page-${page}\`); if (el) el.scrollIntoView(...)`.
Recommended solution:  Keep a `Map<number, HTMLElement>` of page refs (populated via callback refs) instead of id-string lookups, or accept the current approach since it's low-traffic code — not urgent.
Risk:                  None (read-only observation).
Verification method:   n/a.
Status:                Open
```

```
Issue:                Very low `useCallback` usage (3 call sites in the entire `src/` tree) relative to the number of context providers and inline handlers passed to children
Location:             Project-wide; confirmed via `grep -c "useCallback(" src -r` → 3 total, vs. `useMemo(` → 53 total
Severity:             P3
Why it matters:       This isn't "add useCallback everywhere" — most of the 53 `useMemo` call sites reviewed (e.g. `CourseCheckoutPage.tsx:53` memoizing a *literal* `['USD','EUR','AED','KWD','SAR']` array) are fine or borderline-unnecessary (cheap to recompute), so blanket memoization is not the fix. The actual gap is narrow and already called out individually above: the two `createContext` providers (`AuthContext`, `PodcastPlayerContext`) are the only places in the codebase where missing `useCallback`/`useMemo` has a real, app-wide rerender cost (P1 findings above) — everywhere else, the low count is not itself a problem.
Current behavior:      n/a — see P1 findings for AuthContext/PodcastPlayerContext.
Recommended solution:  Don't chase the useCallback count up; fix the two provider `value` objects (already flagged P1) and leave the rest alone.
Risk:                  None.
Verification method:   n/a.
Status:                Open
```

---

## Clean / no issues found

- **Hooks called unconditionally before early returns**, checked project-wide via a scripted scan for "guard-return, then hook call" patterns across all `src/**/*.{ts,tsx}` files: only `settings-page.tsx` (P0 above) is a genuine violation. `book-reader.tsx`, `checkout-page.tsx`, `checkout/components/checkout-page.tsx`, `confirm-dialog.tsx`, and `require-auth.tsx` all correctly call every hook before any conditional `return`, despite each having multiple early-return branches.
- **Empty catch blocks**: `grep -rn "catch\s*(\s*[A-Za-z_]*\s*)\s*{\s*}" src` → zero matches. No swallowed errors of this shape found.
- **Controlled/uncontrolled input mixups**: `grep` for `defaultValue=` co-occurring with `value=` on the same element → zero matches project-wide.
- **`src/features/community/components/community-chat.tsx`**: clean example of the pattern this audit wants — loading state, two distinct error states (room error / messages error, both routed through `AccessDeniedState` with the right variant), empty state ("No messages yet"), and a debounce-free, race-free TanStack Query setup. No changes recommended.
- **`src/features/search/hooks/use-global-search.ts`**: debounced search implemented correctly — debounce via a small `useDebouncedValue` hook (proper cleanup via `clearTimeout`), combined with `useQuery`'s `enabled`/`keepPreviousData`, which already prevents the classic rapid-input race condition (TanStack Query cancels/ignores stale requests itself). No changes recommended.
- **`src/features/auth/hooks/use-otp-resend.ts`**: correct interval-based countdown with cleanup (`clearInterval` in the effect's return). No changes recommended.
- **`src/components/feedback/confirm-dialog.tsx`**: focus-trap/escape-key effect is correctly scoped (`if (!open) return` inside the effect, not a hook-order guard), cleans up its listener and restores focus. No changes recommended.

---

## Component size (top of `find src -name '*.tsx' -exec wc -l {} + | sort -rn`)

| Lines | File | Flagged? |
|---:|---|---|
| 814 | `src/features/checkout/components/checkout-page.tsx` | Yes — P1 above |
| 607 | `src/features/auth/components/auth-page.tsx` | Large (13 `useState`), but hooks are all unconditional and correctly ordered; a decomposition candidate (login/register/reset-password/verify are 4 largely-independent flows in one file) but no correctness bug found — not written up as a separate finding to avoid padding. |
| 411 | `src/features/auth/auth-provider.tsx` | Yes — P1/P2 above |
| 408 | `src/features/account/components/settings-page.tsx` | Yes — P0 above |
| 344 | `src/features/site-content/components/home-page.tsx` | Reviewed for hook-order (false-positive from automated scan, confirmed clean) — not otherwise flagged. |
| 322 | `src/features/books/components/book-reader.tsx` | Yes — P2/P3 above |

Everything else in the top 40 (`quiz-player.tsx`, `course-player.tsx`, `encyclopedia-list.tsx`, `individual-booking-flow.tsx`, etc.) was not individually deep-audited given the volume of the codebase (27 features); the patterns already identified (effect-driven derived state, unmemoized context values, hand-rolled forms instead of react-hook-form) are the ones most likely to recur there and are the highest-value next places to look.
