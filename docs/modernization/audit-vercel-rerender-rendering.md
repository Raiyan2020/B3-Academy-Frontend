# Vercel React Best Practices Audit — Categories 5 & 6 (Re-render Optimization / Rendering Performance)

Scope: `rerender-*` (15 rules) and `rendering-*` (11 rules), 26 rules total, read in full from
`C:\Users\abdallah\.claude\skills\vercel-react-best-practices\rules\` before auditing. Project audited:
`C:\Users\abdallah\Desktop\ahmed\b3-acadmy`, `src/` only, `backend/` excluded. Read-only audit — no
application code was modified.

Context carried in from the brief and not re-derived: ~90/94 `page.tsx` are `'use client'` (this app
is effectively all client-rendered, so these two categories are the most consequential of the eight);
`AuthContext`, `booking-slot-selector.tsx`'s `filters`, and `chat-consultation.tsx`'s `messages` are
already fixed and not re-reported; `react-hooks/rules-of-hooks` is enforced and clean.

## Starting point: the 16 disabled-rule warnings

`react-hooks/set-state-in-effect` and `react-hooks/purity` are disabled in `eslint.config.mjs`. Ran:

```
npx eslint src --rule '{"react-hooks/set-state-in-effect":"warn","react-hooks/purity":"warn"}'
```

Result: **16 warnings, all `react-hooks/set-state-in-effect`** (0 `react-hooks/purity` warnings; 0 errors).
Mapping of each to the correct rule:

| # | Location | Verdict | Rule |
|---|----------|---------|------|
| 1 | `newsletter-page.tsx:45-46` | Violation — query data mirrored into local state every render | `rerender-derived-state-no-effect` |
| 2 | `newsletter-page.tsx:55` | Violation — `canResend` is a pure function of `countdown`/`status` | `rerender-derived-state-no-effect` |
| 3 | `settings-page.tsx:56` | Violation — same pattern as #2, plus non-functional `setState` on the line above | `rerender-derived-state-no-effect` |
| 4 | `ai-chat-widget.tsx:48` | Violation — resets `messages` state whenever the memoized language-derived callback changes | `rerender-derived-state-no-effect` |
| 5 | `auth-provider.tsx:88-90` | **Not a violation** — one-time, `[]`-gated read of `localStorage`/token (external system, SSR-unsafe to read during render) | none |
| 6 | `book-reader.tsx:39` | **Not a violation** — reads external reading-position storage keyed by `user`/`book` identity, correctly scoped | none |
| 7 | `CourseCheckoutPage.tsx:33` | Violation | `rerender-derived-state-no-effect` |
| 8 | `CourseCheckoutPage.tsx:37` | Violation | `rerender-derived-state-no-effect` |
| 9 | `CourseCheckoutPage.tsx:41` | Violation | `rerender-derived-state-no-effect` |
| 10 | `CourseCheckoutPage.tsx:64` | Violation | `rerender-derived-state-no-effect` |
| 11 | `favorite-toggle-button.tsx:39` | Violation (evaluated honestly per brief) — cleaner fix is a `key`, not the effect | `rerender-derived-state-no-effect` |
| 12 | `health-assessment-page.tsx:67` | Violation — bundled with an external `form.reset()` call; the `setCurrentPage(0)` half is derivable/resettable without state | `rerender-derived-state-no-effect` |
| 13 | `course-player.tsx:53` | Violation — default-selection can be computed inline instead of stored | `rerender-derived-state-no-effect` |
| 14 | `course-player.tsx:58` | Violation — resetting all quiz state on `quizSourceId` change; classic `key`-prop case | `rerender-derived-state-no-effect` |
| 15 | `podcast-player-provider.tsx:59-60` | **Not a violation** — one-time (ref-guarded) restore of playback state from `localStorage` after auth is ready | none |
| 16 | `CooperationPage.tsx:19` | Violation — default-selection can be computed inline instead of stored | `rerender-derived-state-no-effect` |

13 of 16 are genuine `rerender-derived-state-no-effect` violations; 3 (auth token bootstrap, reading
position restore, podcast playback restore) are legitimate one-time reads of an external system gated
by identity/mount and are not flagged below. No warning mapped to `rerender-move-effect-to-event` —
none of the 16 model a user action as state-plus-effect; they are all state-derivation problems.

---

## Findings

```
Rule:                rerender-derived-state-no-effect
Issue:                Four separate effects re-derive/correct `orderType` and `courseSectionId` from query data and from each other, each firing its own render pass instead of being computed once during render.
Location:             src/features/courses/ui/CourseCheckoutPage.tsx:32-42, 63-65
Severity:             P1
Why it matters:       This is the textbook "adjusting state when a prop changes" case the rule and the React docs call out — state that is 100% a function of `supportsSectionPayment`/`supportsFullPayment`/`sectionOptions` is stored and corrected via effects instead of derived inline, so the page renders with a stale/incorrect `orderType` for one extra pass every time the checkout preview query resolves.
Current behavior:      ```tsx
  useEffect(() => {
    if (!supportsSectionPayment && orderType === 'section') setOrderType('full');
  }, [orderType, supportsSectionPayment]);
  useEffect(() => {
    if (!supportsFullPayment && supportsSectionPayment && orderType === 'full') setOrderType('section');
  }, [orderType, supportsFullPayment, supportsSectionPayment]);
  useEffect(() => {
    if (!isSectionPayment) setCourseSectionId('');
  }, [isSectionPayment]);
  // ...
  useEffect(() => {
    if (isSectionPayment && courseSectionId && !selectedSection) setCourseSectionId('');
  }, [courseSectionId, isSectionPayment, selectedSection]);
  ```
Recommended solution:  Keep `orderType` as real user-set state only for the case the user explicitly toggles it; compute an `effectiveOrderType` during render (`!supportsSectionPayment ? 'full' : !supportsFullPayment && supportsSectionPayment ? 'section' : orderType`) and use that everywhere instead of correcting `orderType` after the fact. Same for `courseSectionId`: derive `effectiveSectionId = isSectionPayment && selectedSection ? courseSectionId : ''` instead of clearing state in an effect.
Risk:                  Low — this is a checkout page; changing derivation logic warrants a manual pass through each `supportsX` combination and the section-payment flow before merging.
Verification method:   Manually test course checkout for a course with (a) full-only payment, (b) section-only payment, (c) both, confirming the initial `orderType`/section selection is correct with no visible flicker, and add/extend `course-flows.test.tsx` coverage for the derivation.
Status:                Open
```

```
Rule:                rerender-derived-state-no-effect
Issue:                Default type selection stored in state and set via an effect instead of derived from the query result.
Location:             src/features/society/cooperation/CooperationPage.tsx:18-20
Severity:             P2
Why it matters:       `selectedTypeId` only ever needs to default to `types.data[0].id` until the user picks something else — that's derivable during render, not something that needs a state write plus a second render pass.
Current behavior:      `useEffect(() => { if (!selectedTypeId && types.data?.[0]) setSelectedTypeId(types.data[0].id); }, [selectedTypeId, types.data]);`
Recommended solution:  `const effectiveTypeId = selectedTypeId || types.data?.[0]?.id || '';` — use `effectiveTypeId` for the select value and read/write `selectedTypeId` only on explicit user selection. Drop the effect.
Risk:                  Low.
Verification method:   Load the cooperation form and confirm the first type is pre-selected with no console warning and no extra render (React DevTools Profiler).
Status:                Open
```

```
Rule:                rerender-derived-state-no-effect
Issue:                Default lesson selection stored in state and set via an effect instead of derived from `flatLessons`.
Location:             src/features/learning/components/course-player.tsx:50-55
Severity:             P2
Why it matters:       Same "adjust state when a prop/query result changes" pattern — `selectedLessonId` defaulting to the first accessible lesson is a pure function of `flatLessons`, not state that needs an effect to seed.
Current behavior:      ```tsx
  useEffect(() => {
    if (!selectedLessonId && !selectedQuizId && flatLessons.length > 0) {
      const firstAccessible = flatLessons.find((lesson) => lesson.isAccessible !== false && !lesson.isLocked);
      if (firstAccessible) setSelectedLessonId(firstAccessible.id);
    }
  }, [flatLessons, selectedLessonId, selectedQuizId]);
  ```
Recommended solution:  Compute `const effectiveLessonId = selectedLessonId || flatLessons.find(l => l.isAccessible !== false && !l.isLocked)?.id || '';` and use it to derive `currentLesson`/`lessonQuery`; keep `selectedLessonId` state purely for explicit user navigation.
Risk:                  Low-Medium — `lessonQuery`/`quizSourceId` both depend on the selected id, so verify the derived id flows through correctly on first load and after completing a lesson.
Verification method:   Open a course with no prior lesson selected, confirm the first accessible lesson loads without an extra loading flash; check React DevTools Profiler for one fewer commit on mount.
Status:                Open
```

```
Rule:                rerender-derived-state-no-effect
Issue:                Quiz answers reset via an effect keyed on `quizSourceId` instead of using a `key` to remount the quiz state.
Location:             src/features/learning/components/course-player.tsx:57-59
Severity:             P2
Why it matters:       This is the React docs' "Resetting all state when a prop changes" case verbatim — `useEffect(() => { setAnswers({}); }, [quizSourceId])` causes an extra render every time the quiz changes, and is one line away from a bug (any answer set between the query resolving and the effect running briefly shows stale answers for the new quiz).
Current behavior:      `useEffect(() => { setAnswers({}); }, [quizSourceId]);`
Recommended solution:  Extract the quiz-taking UI into a child component keyed by `quizSourceId` (`<QuizPlayer key={quizSourceId} .../>`) and let `answers` live as that child's own local state, initialized fresh on every mount. Drop the effect entirely.
Risk:                  Low — requires pulling the quiz JSX into its own component, a small refactor.
Verification method:   Navigate between two quizzes in the same course and confirm answers never bleed from one quiz to the next, with no reliance on effect ordering.
Status:                Open
```

```
Rule:                rerender-derived-state-no-effect
Issue:                `email`/`status` are mirrored from `backendNewsletter` query data into local state via an effect on every data change.
Location:             src/features/account/components/account-sections/newsletter-page.tsx:43-48
Severity:             P2
Why it matters:       `email` and `status` are fully derivable from `backendStatus`/`user?.email` — storing a copy and syncing it with an effect adds a render pass every time the newsletter query refetches and risks the local copy drifting from the source of truth in between.
Current behavior:      ```tsx
  useEffect(() => {
    if (backendStatus) {
      setEmail(backendStatus.email || user?.email || '');
      setStatus(backendStatus.isConfirmed ? 'confirmed' : backendStatus.status || 'pending');
    }
  }, [backendStatus, user?.email]);
  ```
Recommended solution:  Derive `email`/`status` directly from `backendStatus`/`user` during render for the common case; keep local state only for genuinely user-editable fields (e.g. an in-progress OTP request), seeded lazily from the query the first time it's needed rather than re-synced on every refetch.
Risk:                  Low-Medium — this form has several interleaved flows (OTP resend, unsubscribe); check that the resend/otp flows still see the correct email after the refactor.
Verification method:   Subscribe/unsubscribe/resend flows manually; confirm the displayed email tracks the account without a visible flash on query refetch.
Status:                Open
```

```
Rule:                rerender-derived-state-no-effect
Issue:                `canResend`/`canResendOtp` are stored as separate state and set to `true` via an effect when a countdown reaches zero, instead of being computed from the countdown value.
Location:             src/features/account/components/account-sections/newsletter-page.tsx:50-58; src/features/account/components/settings-page.tsx:51-59
Severity:             P3
Why it matters:       Both booleans are pure functions of `countdown`/`otpCountdown` (`<= 0`); storing them separately means two state variables and an extra render to keep them in sync, when one would do. `settings-page.tsx:54` additionally uses `setOtpCountdown(otpCountdown - 1)` instead of the functional form already used correctly one file over in `newsletter-page.tsx:53` (`setCountdown((c) => c - 1)`) — see the `rerender-functional-setstate` finding below.
Current behavior:      `newsletter-page.tsx`: `else if (countdown === 0) { setCanResend(true); }`. `settings-page.tsx`: `} else if (otpCountdown === 0) { setCanResendOtp(true); }`.
Recommended solution:  Drop `canResend`/`canResendOtp` state; use `const canResend = countdown <= 0` (and same for `canResendOtp`) directly at the point of use. The `setTimeout` countdown effect itself is legitimate (it synchronizes with the browser's clock, an external system) and can stay.
Risk:                  Low.
Verification method:   Trigger an OTP/newsletter resend flow, let the countdown expire, confirm the resend button enables at 0 with no behavior change.
Status:                Open
```

```
Rule:                rerender-derived-state-no-effect
Issue:                Chat conversation is reset via an effect keyed on a language-derived `useCallback`, so opening the widget or switching language wipes the conversation as a side effect of a derived-state sync rather than an explicit user action.
Location:             src/features/ai-assistant/components/ai-chat-widget.tsx:36-49
Severity:             P2
Why it matters:       `resetConversation` depends on `assistantLanguage`; the effect `useEffect(() => { resetConversation(); }, [resetConversation])` therefore reruns — clearing `messages` and `inputValue` — on mount **and every time the user's language toggles**, even mid-conversation. This is a state-reset-on-changed-value case that belongs on a `key`, not a synced effect.
Current behavior:      ```tsx
  const resetConversation = useCallback(() => {
    setMessages([{ role: 'model', text: getWelcomeMessage(assistantLanguage), timestamp: new Date() }]);
    setInputValue('');
  }, [assistantLanguage]);

  useEffect(() => {
    resetConversation();
  }, [resetConversation]);
  ```
Recommended solution:  Initialize `messages` with `useState(() => [{ role: 'model', text: getWelcomeMessage(assistantLanguage), timestamp: new Date() }])` (lazy init, runs once) so no effect is needed for the initial welcome message. If clearing history on language switch is intentional, make it an explicit call from the language-switcher's `onClick`, not an effect side-effect of a memoized callback.
Risk:                  Low-Medium — confirm whether wiping the conversation on language switch is actually desired product behavior; this audit doesn't know so flags it rather than assuming.
Verification method:   Open the chat, send a message, switch language, and confirm behavior matches the intended product decision (either "history is preserved" or "history resets" — currently it silently resets and nobody decided that on purpose in this code path).
Status:                Open
```

```
Rule:                rerender-derived-state-no-effect
Issue:                `isFavorited` is initialized from `initialFavorited` and re-synced via an effect whenever the prop changes across navigations between different favoritable items.
Location:             src/features/favorites/components/favorite-toggle-button.tsx:35, 38-40
Severity:             P2
Why it matters:       Evaluated per the brief's request: the effect is a real fix for a real problem (this component is mounted once per detail page — `BookDetailView`, `CourseDetailView`, `clinic-detail-page.tsx`, `trip-detail-page.tsx`, `encyclopedia-detail.tsx`, `PlantFungiDetailView.tsx` all render exactly one instance per route, never in a list), so `initialFavorited` can change for the *same component instance* when the user navigates from one item's detail page to another's without a remount. The effect is not wrong, but it's the harder-to-reason-about of the two idiomatic fixes for "reset state when the identity changes."
Current behavior:      ```tsx
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  // Keep in sync when the underlying detail item changes (e.g. navigating between items).
  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);
  ```
Recommended solution:  Pass `key={`${type}-${id}`}` from each of the 6 call sites (`BookDetailView.tsx:41`, `CourseDetailView.tsx:149`, `clinic-detail-page.tsx:77`, `trip-detail-page.tsx:112`, `encyclopedia-detail.tsx:198`, `PlantFungiDetailView.tsx:40`) instead of the effect. React will then fully remount `FavoriteToggleButton` with a fresh `useState(initialFavorited)` whenever the item identity changes, which is the pattern this exact rule (and the React docs' "Resetting all state when a prop changes" section) recommend over a sync effect, and removes the extra render the effect currently causes on every navigation between items.
Risk:                  Low — purely additive `key` prop at 6 call sites; verify optimistic-toggle-then-revert-on-error behavior (lines 53-61) still works after the swap.
Verification method:   Navigate from one book/course/clinic/trip detail page directly to another (client-side nav) and confirm the heart icon reflects the new item's favorited state with no stale flash, both with and without the `key` fix, to compare render counts in React DevTools Profiler.
Status:                Open
```

```
Rule:                rerender-derived-state-no-effect
Issue:                Health-assessment form seeds default answers and resets pagination via an effect keyed on a `useMemo`-derived array whose reference identity is fragile.
Location:             src/features/health-assessment/components/health-assessment-page.tsx:41, 58-69
Severity:             P3
Why it matters:       `sections` is `useMemo(() => formQuery.data ?? [], [formQuery.data])` — a new array only when `formQuery.data` changes reference. The `form.reset()` call is a legitimate imperative sync with an external system (react-hook-form), but bundling `setCurrentPage(0)` into the same effect means a background refetch of `formQuery` (e.g. TanStack Query revalidation) silently wipes the user's current page position mid-assessment, which is a state-drift risk more than a pure perf one.
Current behavior:      ```tsx
  useEffect(() => {
    if (!sections.length) return;
    const seeded: Record<string, HealthAssessmentAnswer> = {};
    sections.forEach((section) => { section.conditions.forEach((condition) => { seeded[String(condition.id)] = 'not_present'; }); });
    form.reset({ answers: seeded });
    setCurrentPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);
  ```
Recommended solution:  Keep the `form.reset()` call in an effect (legitimate external-system sync), but gate the reset+page-reset on the *content* of `sections` changing (e.g. a stable query key/hash) rather than firing on every new array reference, or move the reset to run once via a ref guard similar to `podcast-player-provider.tsx`'s `restoredRef` pattern.
Risk:                  Low-Medium — verify this doesn't regress the "seed every condition to not_present on schema arrival" behavior the existing comment describes as intentional.
Verification method:   Start a health assessment, navigate to page 2+, force a background refetch (e.g. refocus the window if `refetchOnWindowFocus` is on) and confirm the page position is not silently reset.
Status:                Open
```

```
Rule:                rerender-defer-reads
Issue:                `LanguageContext`/`CurrencyContext` provider `value` is a fresh object literal with fresh function references on every render, so every one of the ~94 (`useLanguage`) and however-many (`useCurrency`) consumers re-renders on every provider render regardless of whether the field they actually read changed.
Location:             LanguageContext.tsx:573; CurrencyContext.tsx:35
Severity:             P2
Why it matters:       `AuthContext` already received this exact fix (`useMemo` value + `useCallback`-wrapped functions, per the brief). `LanguageContext`/`CurrencyContext` were not, and consume the identical pattern: `t`, `localize` (and `formatPrice`, `convertPrice`) are plain functions recreated every render, and the `<Context.Provider value={{ ... }}>` object is never memoized. In practice `LanguageProvider`/`CurrencyProvider` only re-render when their own `language`/`currency` state changes (they're stateless pass-throughs otherwise, so the trigger frequency is bounded to explicit language/currency switches, not continuous) — but on every such switch, every consumer's callback/effect dependencies that reference `t`/`localize`/`formatPrice`/`convertPrice` (not just `language`/`currency` themselves) invalidate and rerun even where the function body didn't need to change, and any consumer wrapped in `React.memo` downstream (none currently exist in this codebase, see below) would get no benefit from that memoization because the context value identity always changes.
Current behavior:      `<LanguageContext.Provider value={{ language, dir, setLanguage, t, localize }}>` and `<CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice }}>` — both rebuilt inline every render, `t`/`localize`/`formatPrice`/`convertPrice` all plain (non-`useCallback`) closures.
Recommended solution:  Wrap `t`, `localize` (and `formatPrice`, `convertPrice`) in `useCallback`, and wrap the provider `value` in `useMemo` keyed on `[language, dir]` / `[currency]`, mirroring the fix already applied to `AuthContext`. Do not go further and split the context or add `React.memo` everywhere speculatively — the actual measured trigger is bounded to explicit language/currency switches, so this is a correctness-of-references fix, not a "reduce re-render frequency" fix.
Risk:                  Low — mechanical change, same shape as the already-applied `AuthContext` fix; the codebase already has a template to follow.
Verification method:   React DevTools Profiler: toggle language, confirm `t`/`localize` function identity is now stable across renders where `language` didn't change (e.g., a re-render triggered by something else in the tree), and that no existing consumer's `useEffect`/`useMemo` dependency list keyed on these functions fires spuriously.
Status:                Open
```

```
Rule:                rerender-functional-setstate
Issue:                Two `setState` calls read the current state value directly from the closure instead of using the functional updater form.
Location:             src/features/account/components/settings-page.tsx:54; src/features/consultations/components/package-booking-flow.tsx:106
Severity:             P3
Why it matters:       `setOtpCountdown(otpCountdown - 1)` inside a `setTimeout` closure and `setSessionIndex(sessionIndex + 1)` both risk stale-closure bugs if the surrounding function is ever memoized or the state update batches with another update to the same variable; the correct pattern is demonstrated correctly one file over (`newsletter-page.tsx:53`: `setCountdown((c) => c - 1)`).
Current behavior:      `settings-page.tsx:54`: `timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);`. `package-booking-flow.tsx:106`: `setSessionIndex(sessionIndex + 1);`.
Recommended solution:  `setOtpCountdown((c) => c - 1)`; `setSessionIndex((i) => i + 1)`.
Risk:                  None — mechanical, behavior-preserving change.
Verification method:   Existing OTP-countdown / multi-session-booking manual flows; no observable behavior change expected.
Status:                Open
```

```
Rule:                rerender-memo
Issue:                `fullPriceLabel` is computed via `useMemo` (constructing an `Intl.NumberFormat` and formatting a price) before the component's loading/error/not-found early returns, so the computation runs and is discarded on every render of the loading and error states.
Location:             src/features/courses/ui/CourseCheckoutPage.tsx:44-51 (computed), :93-110 (discarded by early returns)
Severity:             P2
Why it matters:       This is the rule's exact example: expensive-ish work computed before a conditional early return wastes the computation whenever that early return fires — here, on every render while `previewQuery`/`methodsQuery` are loading or errored.
Current behavior:      `fullPriceLabel` (and its `Intl.NumberFormat` construction) is computed at line 44, but lines 93-110 return early for loading/error/no-course states before it's ever rendered.
Recommended solution:  Move the loading/error/no-course early returns above the `useMemo` calls (they already don't depend on `course`, so this is safe), or extract the price-label block into its own small component rendered only once `course` is confirmed present.
Risk:                  Low — pure reordering; the early-return conditions (`previewQuery.isLoading`, `.isError`, `!course`) don't reference anything computed by the memos being moved below them.
Verification method:   React DevTools Profiler: confirm no `Intl.NumberFormat` construction/format call happens while the checkout page is in its loading state.
Status:                Open
```

```
Rule:                rerender-simple-expression-in-memo
Issue:                A fully static array literal is wrapped in `useMemo` with an empty dependency array — memoizing something that never needed a hook at all.
Location:             src/features/courses/ui/CourseCheckoutPage.tsx:53
Severity:             P3
Why it matters:       The brief specifically asks for existing over-memoization to be flagged. `useMemo(() => ['USD', 'EUR', 'AED', 'KWD', 'SAR'], [])` pays a hook-call and dependency-array-comparison cost on every render for a value that is 100% static — it doesn't even need the "referential stability so a memoized child doesn't re-render" justification `useMemo(() => x || [], [x])` patterns elsewhere in this codebase legitimately use, because there is no changing input at all.
Current behavior:      `const paymentCurrencies = useMemo(() => ['USD', 'EUR', 'AED', 'KWD', 'SAR'], []);`
Recommended solution:  Hoist it out of the component entirely: `const PAYMENT_CURRENCIES = ['USD', 'EUR', 'AED', 'KWD', 'SAR'];` at module scope. Zero hook overhead, and a genuinely stable reference (this is also the `rendering-hoist-jsx` rule's underlying principle applied to a plain array instead of JSX).
Risk:                  None.
Verification method:   n/a — mechanical.
Status:                Open
```

```
Rule:                rerender-dependencies
Issue:                `changePassword`/`deleteAccount` callbacks depend on the whole `user` object when they only need `user.id` (and a truthiness check).
Location:             src/features/auth/auth-provider.tsx:236-239 (representative; `deleteAccount` at :241+ follows the same shape)
Severity:             P3
Why it matters:       Every unrelated `user` field change (e.g. a profile-name edit elsewhere) recreates these `useCallback`-wrapped functions even though their bodies only care about `user.id`/truthiness, defeating the referential stability `AuthContext`'s `useCallback` wrapping was meant to provide.
Current behavior:      `const changePassword = useCallback((input) => { if (!user || ...) return false; return changeStoredPassword(user.id, ...); }, [user]);`
Recommended solution:  Depend on `[user?.id]` (with an explicit `if (!user)` guard still inside the body, or via a separate `const userId = user?.id` read at the top of the provider) instead of `[user]`.
Risk:                  Low — verify no other logic inside these callbacks implicitly relies on a fresher `user` object beyond `.id`.
Verification method:   React DevTools Profiler / manual dependency-array inspection after a profile-field edit — confirm `changePassword`/`deleteAccount` identities are unchanged when only unrelated `user` fields change.
Status:                Open
```

```
Rule:                rendering-resource-hints
Issue:                The app calls its backend API on a genuinely different origin from page load (auth check, first data fetch) but never issues a `preconnect`/`prefetchDNS` for that origin.
Location:             src/app/layout.tsx (root layout, no resource hints present); src/lib/api/base-fetch.ts:19 (`DEFAULT_API_BASE_URL = 'https://portal.b3.raiyan.cc/'`)
Severity:             P1
Why it matters:       This is the rule's flagship example verbatim ("preconnect to third-party APIs"), rated HIGH impact in the rule file. Because ~90/94 pages are client components that fire a TanStack Query request to `portal.b3.raiyan.cc` essentially on mount (auth bootstrap, initial data), every single page load pays full DNS + TCP + TLS handshake latency to that origin serially, after the HTML/JS has already loaded, instead of in parallel with it.
Current behavior:      `src/app/layout.tsx` has no `preconnect`/`prefetchDNS` calls at all; the only external resource optimization present is `next/font`'s automatic self-hosting of the Alexandria font (already optimal, no action needed there).
Recommended solution:  In `RootLayout`, call `preconnect('https://portal.b3.raiyan.cc')` from `react-dom` (or `prefetchDNS` if TLS setup for every visitor is undesirable) before rendering `<html>`, matching the rule's own root-layout example.
Risk:                  None — additive, no behavior change; worst case is an unused connection if a page truly never calls the API (rare given the auth bootstrap effect runs on every route).
Verification method:   Network panel / Lighthouse: confirm a `Connection: keep-alive` handshake to `portal.b3.raiyan.cc` starts before the first XHR/fetch to it does, and that the resulting waterfall shows reduced time-to-first-byte on the initial API call.
Status:                Open
```

```
Rule:                rendering-usetransition-loading
Issue:                Checkout payment confirmation uses a manually-managed `isProcessing` boolean reset from 8 separate call sites across nested branches instead of `useTransition`'s automatically-resetting `isPending`.
Location:             src/features/checkout/components/checkout-page.tsx:78 (state), :288-521 (8 `setIsProcessing(false)` call sites across early-return branches inside `confirmPayment`)
Severity:             P1
Why it matters:       This is the exact fragility the rule warns about: "Error resilience: Pending state correctly resets even if the transition throws." Here, resetting `isProcessing` is the developer's responsibility on every single branch of a multi-step payment-confirmation flow (slot no longer available, trip sold out, coupon gateway decline, completion failure, subscription success, course success, etc.). Missing just one reset on a future edited/added branch leaves the "Confirm payment" button permanently disabled with a stuck "Processing..." label — in the payment flow specifically.
Current behavior:      ```tsx
  const confirmPayment = () => {
    if (!intent) return;
    setIsProcessing(true);
    // ...
    window.setTimeout(() => {
      if (requiresSlot && slotId && !isSlotAvailable(slotId)) { /* ... */ setIsProcessing(false); return; }
      if (type === 'trip-package' && isTripSoldOut(id)) { /* ... */ setIsProcessing(false); return; }
      if (failedByCoupon) { /* ... */ setIsProcessing(false); return; }
      const record = completePaymentIntent(intent.id);
      if (!record) { /* ... */ setIsProcessing(false); return; }
      // ... more branches, more setIsProcessing(false) calls
    }, ...);
  };
  ```
Recommended solution:  Wrap the body in `startTransition` from `useTransition` and drop the manual `isProcessing` state and all 8 reset calls; use the hook's `isPending` for the button's disabled/label state. React resets `isPending` automatically on every code path, including thrown errors, eliminating the "forgot to reset on this branch" failure mode entirely.
Risk:                  Medium — this is the largest, most business-critical file identified in the audit (814 lines) with a multi-branch payment flow; changing its state-management shape needs careful manual regression testing of every branch (slot unavailable, trip sold out, coupon decline, completion failure, subscription/course/trip success paths).
Verification method:   Manually trigger every branch in `confirmPayment` (via the `FAIL` coupon code and other test-data hooks already present in this simulated flow) and confirm the button's pending state always clears correctly; add a regression test asserting `isPending` resets after a thrown/rejected path.
Status:                Open
```

```
Rule:                rendering-activity
Issue:                The chat widget's message panel is fully unmounted (`{isOpen && (...)}`) rather than hidden, so opening/closing repeatedly tears down and rebuilds the whole panel's DOM and `motion` animation instances.
Location:             src/features/ai-assistant/components/ai-chat-widget.tsx:90-98
Severity:             P3
Why it matters:       This is exactly the "expensive component that frequently toggles visibility" case the rule targets — a chat widget is opened/closed repeatedly within a session by design. Every close+reopen re-runs the mount-time `useEffect`s (scroll-to-bottom, focus, the language-reset effect above), and rebuilds the whole subtree instead of just toggling visibility.
Current behavior:      `<AnimatePresence>{isOpen && (<motion.div ...>...</motion.div>)}</AnimatePresence>` — full unmount/remount on every toggle.
Recommended solution:  This is a genuine trade-off, not a clean swap: `<Activity>` would avoid the remount cost, but `AnimatePresence`'s exit animation on close relies on the element actually unmounting, so switching to `<Activity mode={isOpen ? 'visible' : 'hidden'}>` would remove the current close animation unless paired with `motion`'s own presence-aware APIs. Recommend this only if the close-transition can be reworked to animate via CSS/`Activity`-aware means; otherwise leave as-is and treat this as a documented trade-off rather than an unconditional fix.
Risk:                  Medium — touches an animation UX decision, not just a perf knob.
Verification method:   If adopted: React DevTools Profiler showing no remount (no fresh mount-effect run) on reopen; manual check that the open/close visual transition is preserved.
Status:                Open
```

```
Rule:                rendering-animate-svg-wrapper
Issue:                Tailwind's `animate-spin` class is applied directly to `lucide-react` icon components (which render as `<svg>`), instead of to a wrapping element.
Location:             11 occurrences, e.g.: src/components/feedback/confirm-dialog.tsx:73; src/components/feedback/feedback.tsx:26; src/components/ui/submit-button.tsx:20; src/features/health-assessment/components/health-assessment-page.tsx:175; src/features/search/components/search-page.tsx:40
Severity:             P3
Why it matters:       `className` on a `lucide-react` icon forwards straight to the root `<svg>` element, so `animate-spin`'s CSS `transform: rotate(...)` animation runs directly on the SVG — the case the rule specifically calls out as lacking hardware acceleration in some browsers.
Current behavior:      `<LoaderCircle size={16} className="animate-spin" />`, `<Loader2 className="animate-spin" size={26} />`, etc. — 11 sites total, all spinners.
Recommended solution:  Wrap each spinner icon in a `<div className="animate-spin">` and drop the class from the icon itself, or introduce a small shared `<Spinner />` component that does this once and replace all 11 call sites with it (also reduces duplication).
Risk:                  Low — purely visual wrapper; verify sizing/alignment (`inline-flex` or similar on the wrapper) isn't affected at each of the 11 sites.
Verification method:   Visual check of each spinner after the wrapper change; DevTools rendering/paint profiling on a low-end device profile to confirm the animation is now composited.
Status:                Open
```

```
Rule:                rendering-conditional-render
Issue:                `&&` used for conditional rendering in JSX, 96 occurrences across `src/**/*.tsx`.
Location:             Representative: src/features/checkout/components/checkout-page.tsx:669 (`discount > 0 && ...`); src/features/account/components/account-sections/password-page.tsx:57,60-61; src/features/admin/components/admin-book-edit-page.tsx:112,114,116; src/features/books/ui/BookDetailView.tsx:47,63
Severity:             P3
Why it matters (the actual failure mode, per the rule): `{value && <JSX/>}` renders the *value itself* (not "nothing") whenever it's falsy-but-not-`undefined`/`null`/`false`/`""` — specifically, `0` and `NaN` are rendered as visible text (`<div>0</div>`) instead of nothing, because React renders numbers as text nodes. The bug requires a numeric operand that can legitimately be `0` (a `.length`, a `count`, an amount) used bare, without a `> 0`/`!== 0` comparison.
Current behavior:      Audited all 96 occurrences (script-driven scan matching `{expr && <...` and `{expr && (` across every `.tsx` file). None currently use a bare numeric/length operand — every occurrence uses a boolean (`isPending`, `isConfirming`), an object/string that is safely non-rendering when falsy (`description`, `error`, `clinic.doctor`), or an already-guarded numeric comparison (`discount > 0 && ...`). **No live instance of the 0/NaN rendering bug was found.**
Recommended solution:  No fix required for existing code. Given the scale (96 sites) and that this is exactly the kind of bug that's invisible until a numeric prop is introduced later (e.g. someone changes `description` to sometimes be a count, or adds a new `unreadCount && <Badge>` without noticing the existing convention), consider standardizing on explicit ternaries (`cond ? <X/> : null`) for new code, especially anywhere a numeric value is anywhere near the condition, rather than a blanket codemod of all 96 sites (not warranted — no bug present, would be pure churn).
Risk:                  N/A — no change recommended to existing code.
Verification method:   The scan itself (`grep`-based extraction of every `{expr && <` / `{expr && (` occurrence in `src/**/*.tsx`, followed by a keyword filter for `length|count|total|num|quantity|amount|remaining|unread|index|price|score|size|balance` operands without a comparison operator) returned 0 matches; spot-checked 40 of the 96 by hand.
Status:                Open (informational — process recommendation, not a code fix)
```

## Rules checked — no violations

- `rerender-no-inline-components` — verified with an AST-light script scanning every `.tsx` file in `src/` for capitalized `function`/arrow-`const` declarations at non-zero indentation (i.e., nested inside another component). **0 found.** Sanity-checked the detector against a known nested lowercase helper (`search-page.tsx:58`, `function renderBody()`) to confirm it would catch a real nested declaration — it did, confirming the 0-result for capitalized (component) names is a genuine clean result, not a detector miss.
- `rerender-lazy-state-init` — every non-lazy `useState(fn())`-shaped call found is a cheap property read or `String(x ?? default)` coercion (e.g. `useState(user?.name ?? '')`, `useState(String(initial?.price ?? 0))`), which the rule itself says doesn't need the function form. No `JSON.parse`, `localStorage` read, index-building, or other expensive eager initializer found in any `useState(...)` call.
- `rerender-memo-with-default-value` — `React.memo`/`memo()` is not used anywhere in `src/` (0 occurrences), so this bug pattern cannot exist yet.
- `rerender-use-ref-transient-values` — only one high-frequency DOM event handler found (`book-reader.tsx:146`, `onScroll`), and it already guards its `setPage` call with `if (currentPage !== page)` so it does not re-render on every scroll tick, only on page-boundary crossings that are meant to be visible. Not a violation.
- `rerender-use-deferred-value` — the one real debounced-input case (`/search`, `use-global-search.ts`) uses a hand-rolled 350ms `setTimeout` debounce, which is the *more* correct tool here (network request rate-limiting, not render deferral — `useDeferredValue` wouldn't reduce API call frequency the way the existing timer does). The only `cmdk` command-palette usage (`command.tsx`) backs a country-code phone-number picker with a small, bounded list — no expensive filter to defer.
- `rerender-transitions` — no continuous/high-frequency `setState` calls (scroll position, mouse tracking) feeding UI updates were found outside the already-guarded `book-reader.tsx` scroll handler above.
- `rerender-split-combined-hooks` — the several `useMemo`-based list filters (`admin-books-page.tsx`, `admin-clinics-page.tsx`, etc.) each perform one single-pass filter combining `search` + `statusFilter` in one loop, not two independent operations (e.g. filter-then-sort) chained with different dependencies. Not a violation of this rule.
- `rendering-script-defer-async` — zero `<script>` tags anywhere in `src/` (checked `layout.tsx` and the whole app); the only `<script>` match is inside a test file's mock HTML string, irrelevant to production rendering.
- `rendering-svg-precision` — no SVG asset files exist anywhere in `src/` or `public/`; all icons come from `lucide-react` (React components, not raw path data to optimize). Nothing to check.
- `rendering-hoist-jsx` — no significant static JSX blocks (large icon sets, static SVGs, repeated skeleton markup) were found defined inside component bodies and recreated every render; the app's UI is largely data-driven rather than built from large static JSX trees.
- `rendering-content-visibility` — 9 scrollable containers found (chat message lists, an encyclopedia grid), but none has confirmed evidence of rendering hundreds-to-thousands of items at once (no virtualization library is installed, and list sizes appear to be tens of items, not the 1000-message case the rule's example targets). No confirmed long-list violation to report.
- `rendering-hydration-no-flicker` — the app's client-only data (auth user, reading position, podcast playback state) is deliberately read only inside `useEffect`, and the corresponding UI is gated behind that same client-only state (`user` starts `null` and is only set post-effect), so server-rendered and first-client-render HTML are consistently in the "no data yet" state — no localStorage-during-render SSR breakage and no flicker pattern found.
- `rendering-hydration-suppress-warning` — 0 uses of `suppressHydrationWarning` anywhere; 16 `toLocaleDateString`/`toLocaleString`/`toLocaleTimeString` call sites were audited, and every one renders from data that is itself only available post-mount (query data, authenticated `user`, or client-created `Date` objects from user actions) — the same "starts null/undefined on both server and first client render" pattern noted above — so none of them can actually produce a server/client text mismatch in practice. No violation to report.

## Notes on the eslint-flagged effects judged legitimate (not reported above)

- `auth-provider.tsx:86-103` — one-time (`[]` deps) read of `getStoredApiToken()`/`readStoredUser()` (browser `localStorage`), which cannot run during SSR. This is the canonical legitimate use of an effect ("synchronize with an external system on mount"), not a derived-state case — there is no prop/state this value could be computed from.
- `book-reader.tsx:37-41` — re-reads `getReadingPosition(user.id, book.id)` (localStorage) when `user`/`book`/`owned` change, i.e. when the user navigates between books without a full route remount. Same external-system justification as above.
- `podcast-player-provider.tsx:49-66` — ref-guarded (`restoredRef.current`), runs exactly once after `isAuthReady`, restoring playback state from `localStorage`. Same justification, already defensively coded against re-firing.
