# Vercel React Best Practices Audit — Category 7 (JavaScript Performance) & Category 8 (Advanced Patterns)

Scope: `src/` plus the two live root files `data.ts` and `LanguageContext.tsx`. `backend/` (Laravel), `node_modules/`, `.next/`, and `*.test.ts(x)` were excluded.

Rules source: `C:\Users\abdallah\.claude\skills\vercel-react-best-practices\rules\{js-*,advanced-*}.md` (18 rules read in full before auditing).

Overall assessment: this is a demo/mock-data-backed app (`data.ts`, `MOCK_*` arrays, localStorage-backed "repositories"). Collections are realistically small (tens of items, not thousands), so almost nothing here rises above P2. The one thing worth real attention is the complete absence of an in-memory cache in front of `localStorage`, which is read raw and repeatedly across the whole app, including inside a per-lesson loop.

---

## Findings

```
Rule:                 js-cache-storage
Issue:                No in-memory caching layer in front of localStorage. Every helper in src/lib/storage/safe-local-storage.ts calls window.localStorage.getItem directly and JSON.parse's the result on every invocation, with no Map cache. This pattern is then called repeatedly and, in one case, inside a loop.
Location:             src/lib/storage/safe-local-storage.ts:16-51 (root cause); hot-path call site: src/features/learning/services/course-progress.service.ts:33-42,49-51 via src/features/account/services/account-selectors.service.ts:200-201
Severity:             P2
Why it matters:       js-cache-storage says localStorage/sessionStorage reads are synchronous and expensive and should be cached in memory, invalidated on external changes. Here `getCourseProgress(userId, courseId)` calls `getAllCourseProgress()` → `readLocalStorageJson(COURSE_PROGRESS_KEY, [])`, which re-reads and re-JSON.parses the *entire* progress array from localStorage, then does a linear `.find()` — and `isLessonComplete()` wraps that. `selectAccountCourses` in account-selectors.service.ts calls `isLessonComplete()` once per lesson inside `lessons.filter(...)`. For a course with N lessons that's N separate localStorage reads + N full-array JSON.parse + N linear scans, every time the account "my courses" list renders.
Current behavior:     account-selectors.service.ts:200-201
                       `const lessons = course.modules.flatMap((module) => module.lessons);`
                       `const completedLessons = lessons.filter((lesson) => isLessonComplete(userId, course.id, lesson.id)).length;`
                       course-progress.service.ts:33-38
                       `function getAllCourseProgress() { return readLocalStorageJson<CourseProgressRecord[]>(COURSE_PROGRESS_KEY, []); }`
                       `export function getCourseProgress(userId: string, courseId: string): CourseProgressRecord {`
                       `  const existing = getAllCourseProgress().find((record) => record.userId === userId && record.courseId === courseId);`
                       safe-local-storage.ts:43-51 has no cache at all:
                       `export function readLocalStorageJson<T>(key: string, fallback: T): T {`
                       `  const raw = getLocalStorageItem(key);` // always hits window.localStorage.getItem
                       `  ...`
Recommended solution:  Add a small Map-based cache inside safe-local-storage.ts (per the rule's exact pattern), keyed by storage key, populated by `readLocalStorageJson` and invalidated by `writeLocalStorageJson`/`removeLocalStorageItem` and the `storage` event for cross-tab changes. This fixes every caller transitively — course-progress, payments-storage, community-content, account-records, etc. — without touching each service.
Risk:                  Low if invalidation is done correctly on every write path (writeLocalStorageJson/removeLocalStorageItem) and on the `storage` event; stale-cache bugs are possible if a write path is missed.
Verification method:   Add a call counter or spy on `window.localStorage.getItem` in a test/dev harness, render the account courses page for a course with 20+ lessons, and confirm the read count drops from O(lessons) to O(1) per distinct key per render pass.
Status:                Open
```

```
Rule:                  js-cache-storage
Issue:                 The auth token (`b3_api_token`) and UI language (`b3_lang`) are read directly from `window.localStorage` — with no cache — inside every outgoing API request, and again in a second, independent copy of the same logic.
Location:              src/lib/api/base-fetch.ts:65-76 (getStoredToken/getStoredLanguage, called from apiFetch on every request); duplicated in src/lib/api/download.ts:10-11; also src/features/auth/services/auth-api.service.ts:80-88
Severity:              P2
Why it matters:        `apiFetch` is the shared client used by essentially every service in `src/features/*/services/*.ts` that talks to the backend. Per the rule, storage reads are synchronous/expensive and should be cached; here two `localStorage.getItem` calls happen on the main thread for every single request, and the same read is duplicated (not even shared) between base-fetch.ts, download.ts, and auth-api.service.ts.
Current behavior:      base-fetch.ts:65-76
                        `function getStoredToken() { if (typeof window === 'undefined') return undefined; return window.localStorage.getItem('b3_api_token') || undefined; }`
                        `function getStoredLanguage() { if (typeof window === 'undefined') return undefined; return window.localStorage.getItem('b3_lang') || undefined; }`
                        called on every request at base-fetch.ts:99-100.
Recommended solution:  Reuse the same cached-storage helper proposed above (`getLocalStorage(key)` from safe-local-storage.ts) in base-fetch.ts, download.ts, and auth-api.service.ts instead of three separate raw `localStorage.getItem` call sites, and invalidate the token entry specifically on login/logout.
Risk:                  Low — must invalidate the token cache on login/logout/token-refresh or requests will use a stale token.
Verification method:   Instrument `localStorage.getItem` calls (or check via DevTools Performance panel) while navigating a page that fires several API calls in quick succession; confirm one read per key instead of one per request.
Status:                Open
```

```
Rule:                  js-index-maps
Issue:                 selectAccountTrips maps over the user's trip purchases and, for each trip, calls getPaymentRecords(userId).find(...) — re-fetching and re-scanning the full payments array from scratch on every iteration instead of building one lookup map first.
Location:              src/features/account/services/account-selectors.service.ts:291-295 (also the single-lookup sibling at :332-334 in selectAccountSubscription)
Severity:              P3
Why it matters:        Textbook O(n×m) pattern the rule targets — build the Map once, then O(1) per item. Each `getPaymentRecords(userId)` call also re-reads localStorage per the js-cache-storage finding above, so this compounds two issues at once. Rated P3 rather than higher because a user's own payment-record and trip-purchase arrays are realistically small (tens, not thousands) in this app.
Current behavior:      `return getStoredTripPurchases(userId).map((trip) => {`
                        `    const catalogTrip = getTripPackageById(trip.tripId);`
                        `    const payment = trip.paymentId`
                        `      ? getPaymentRecords(userId).find((record) => record.id === trip.paymentId)`
                        `      : undefined;`
Recommended solution:  Fetch `getPaymentRecords(userId)` once before the `.map()`, build `const paymentById = new Map(records.map(r => [r.id, r]))`, and use `paymentById.get(trip.paymentId)` inside the loop.
Risk:                  Very low, pure refactor.
Verification method:   Unit test selectAccountTrips with a mocked payments-storage module asserting getPaymentRecords is called exactly once regardless of trip count.
Status:                Open
```

```
Rule:                  js-min-max-loop
Issue:                 selectInProgressCourse sorts the user's entire in-progress course list purely to read index [0] (the single course with the highest completion ratio).
Location:              src/features/account/services/account-selectors.service.ts:417-422
Severity:              P3
Why it matters:        The rule's canonical incorrect example is exactly `sorted[0]` after a full sort; a single O(n) pass tracking the running max avoids the O(n log n) sort. P3 because a user's own in-progress-course list is small (dashboard widget), not a large dataset.
Current behavior:      `return inProgress.sort((a, b) => b.completedLessons / b.totalLessons - a.completedLessons / a.totalLessons)[0];`
Recommended solution:  `let best = inProgress[0]; for (const c of inProgress) { if (c.completedLessons / c.totalLessons > best.completedLessons / best.totalLessons) best = c; }` (cache the ratio once per item to also satisfy js-cache-function-results-style repeated division). Note: `inProgress` is a fresh array from `.filter()` earlier in the same function, so this is not a mutation/correctness issue — purely an efficiency one.
Risk:                  None — behavior-preserving.
Verification method:   Existing/added unit test asserting selectInProgressCourse returns the course with the max ratio for a small fixture set.
Status:                Open
```

```
Rule:                  js-hoist-regexp
Issue:                 Two regex literals are re-created on every call inside functions invoked once per outgoing API request, instead of being hoisted to module scope.
Location:              src/lib/api/base-fetch.ts:37 (`/\/api\/v1$/i` inside joinUrl) and :44 (`/^https?:\/\//i` inside resolveApiUrl)
Severity:              P3
Why it matters:        Per the rule, RegExp literals evaluated inside a function body allocate a new RegExp object on every call (regex literal caching was removed from the spec outside of top-level/ES5 semantics); `resolveApiUrl`/`joinUrl` run for every request made through `apiFetch`, so this is a real (if very cheap) per-request allocation. Confirmed by reading the file: neither regex is declared at module scope, both live inside the function bodies that use them, and both patterns are static (no interpolation), so hoisting is a pure win with no behavior change.
Current behavior:      base-fetch.ts:34-46
                        `function joinUrl(baseUrl: string, path: string) {`
                        `  ...`
                        `  if (/\/api\/v1$/i.test(base) && normalizedPath.startsWith('/api/v1/')) {`
                        `export function resolveApiUrl(path: string) {`
                        `  if (/^https?:\/\//i.test(path)) return path;`
Recommended solution:  `const API_V1_SUFFIX_RE = /\/api\/v1$/i;` and `const ABSOLUTE_URL_RE = /^https?:\/\//i;` at module scope (top of base-fetch.ts), reference them in place of the literals. Neither is a global (`/g`) regex, so there's no shared-`lastIndex` hazard from hoisting.
Risk:                  None.
Verification method:   No behavior change (same regex source/flags); confirm existing API-related tests still pass.
Status:                Open
```

```
Rule:                  advanced-event-handler-refs
Issue:                 ConfirmDialog's keydown-Escape effect lists the onCancel prop callback in its dependency array alongside open/isConfirming, so any parent re-render that passes a new onCancel reference (e.g. an inline arrow function) re-runs the effect — which re-captures document.activeElement into `previous` and re-focuses the confirm button — while the dialog is still open.
Location:              src/components/feedback/confirm-dialog.tsx:29-41
Severity:              P3
Why it matters:        Matches the rule's "re-subscribes on every render" incorrect example, and here the re-run has a visible side effect beyond just add/removeEventListener churn: it steals focus back to the confirm button and resets the "previously focused element to restore on close" snapshot every time the callback identity changes, not just on open/close. Rated P3 (not higher) because this component currently has no importers anywhere in `src/` — it's unused/dead code today, so there is no live user-facing impact, but the bug would activate the moment it's wired up with a non-memoized `onCancel`.
Current behavior:      `useEffect(() => {`
                        `    if (!open) return;`
                        `    const previous = document.activeElement as HTMLElement | null;`
                        `    confirmRef.current?.focus();`
                        `    const onKeyDown = (event: KeyboardEvent) => {`
                        `      if (event.key === 'Escape' && !isConfirming) onCancel();`
                        `    };`
                        `    document.addEventListener('keydown', onKeyDown);`
                        `    return () => {`
                        `      document.removeEventListener('keydown', onKeyDown);`
                        `      previous?.focus();`
                        `    };`
                        `  }, [onCancel, open, isConfirming]);`
Recommended solution:  Store `onCancel` (and `isConfirming`) in a ref updated by a separate effect (or via `useEffectEvent` once adopted — see advanced-use-latest), and depend only on `open` for the subscribe/focus effect, per the rule's "Correct" pattern.
Risk:                  Low, but verify focus-restore behavior manually since it's UI-visible.
Verification method:   Once wired up: render with an inline (non-memoized) onCancel, trigger an unrelated parent re-render while the dialog is open, confirm the confirm button is not re-focused and `previous` is not reset.
Status:                Open
```

---

## Rules checked — no violations

- `js-batch-dom-css` — no direct `.style.<prop> =` assignments found in `src/`; no interleaved layout-read/style-write sequences.
- `js-cache-function-results` — no expensive pure function (slugify/formatting-style) called repeatedly with the same input inside a render loop at meaningful scale; `localize()`/`t()` calls seen inside `.map()` (16 sites) are plain object-property lookups, already O(1) (see `js-index-maps` note on `LanguageContext.tsx` below), not worth caching separately.
- `js-combine-iterations` — no case found of the same array being `.filter()`'d multiple times for different subsets in one function; each service's filters run over independent source arrays.
- `js-early-exit` — no "process everything then report first error" guard-pyramid pattern found; validation-style functions in the codebase already return early.
- `js-length-check-first` — no array-equality/deep-comparison helpers using `sort().join()` or similar were found anywhere in `src/`.
- `js-flatmap-filter` — the `.map(...).filter(Boolean)` pattern does appear (e.g. `src/features/books/ui/BookCatalogPage.tsx:26`, `src/features/trips/components/trips-page.tsx:32,36`, `src/features/admin/components/admin-assistant-page.tsx:96-135`), but every instance runs over small, UI-scoped arrays (form field splits, category-facet lists derived from a catalog page) — not worth flagging as a finding per the stated severity bar.
- `js-request-idle-callback` — no analytics/telemetry/prefetch calls found running synchronously inside user-interaction handlers; no `requestIdleCallback` usage either way, and none of the codebase's handlers do enough non-critical work to warrant it.
- `js-index-maps` / `js-set-map-lookups` (general) — `LanguageContext.tsx`'s `translations` lookup (`t(key)`) and `data.ts` are plain object/array literals accessed by direct key (`translations[key]`), which is already O(1); no linear-scan translation lookup exists, contrary to what a large translation file might suggest.
- `js-tosorted-immutable` — every `.sort()` call site found in `src/` (22 total, e.g. `account-selectors.service.ts:421`, `admin-users.service.ts:30`, `books.service.ts:90,142`, `community-content.service.ts:305,332,359`, `courses.service.ts:127,140,149`, `encyclopedia.service.ts:136,153,159,211,217`, `monograph.service.ts:64`, `podcasts.service.ts:87`, `site-configuration.service.ts:39`, `BookCatalogPage.tsx:30`, `slot-repository.service.ts:137`) sorts an array that was itself just produced by a preceding `.filter()`, `.map()`, `Array.from()`, or spread in the same expression — never a prop/state/query-cache array sorted in place. **No mutation correctness bug found.**
- `advanced-effect-event-deps` — `useEffectEvent` is not used anywhere in the codebase, so this rule has no applicable violation (nothing to misuse).
- `advanced-init-once` — the only app-wide init-on-mount effect (`AuthProvider`'s token/user hydration in `src/features/auth/auth-provider.tsx:86-103`) runs in a provider mounted once at the app root and is idempotent; no duplicate-init pattern found.
- `advanced-use-latest` — no `setTimeout`/`setInterval` effect was found closing over an unstable callback prop in a way that would benefit from `useEffectEvent` (the countdown timers in `newsletter-page.tsx` and `settings-page.tsx` only reference local state, and `podcast-player-provider.tsx`'s interval closes over `currentPodcast`, which is correctly listed as a dependency).
