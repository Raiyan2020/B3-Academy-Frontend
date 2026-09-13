# Vercel React Performance Audit — Server-Side Performance & Client-Side Data Fetching

Scope: Category 3 (`server-*`, 10 rules) and Category 4 (`client-*`, 4 rules) from
`~/.claude/skills/vercel-react-best-practices/rules/`. Read-only audit, `backend/` excluded.

Method: full-repo search under `src/` for the constructs each rule targets (`'use server'`,
`src/app/api`, `React.cache`, module-level `let`/mutable state, `addEventListener`,
`localStorage.setItem`/`getItem` and the `readLocalStorageJson`/`writeLocalStorageJson`
helpers, `after()`, RSC prop-passing at the one server-rendering page), then read the
surrounding code for every hit before writing a finding.

---

## Findings

```
Rule:                server-parallel-fetching
Issue:
Location:            src/lib/api/base-fetch.ts:65-68 (getStoredToken), src/lib/api/base-fetch.ts:99
                      (used unconditionally by apiFetch); src/app/(site)/books/page.tsx (the only
                      page.tsx among 94 that does server-side fetching)
Severity:             P2
Why it matters:      server-parallel-fetching's whole premise is that RSC composition lets
                      independent server components fetch concurrently instead of the client
                      waiting for sequential mount → effect → fetch waterfalls. That premise
                      requires a fetch client that can run on the server. `apiFetch` reads its
                      bearer token via `getStoredToken()`, which does
                      `if (typeof window === 'undefined') return undefined;` — i.e. it silently
                      drops auth whenever it runs server-side. Any authenticated data fetch
                      therefore cannot be safely prefetched in a Server Component, so 89 of the
                      93 remaining `page.tsx` files are `'use client'` and fetch entirely from
                      the browser on mount, via `next-router-compat.tsx`'s React-Router-shaped
                      routing. Only `src/app/(site)/books/page.tsx` fetches server-side (public,
                      unauthenticated book listings), and it does apply this rule correctly with
                      `Promise.all([...])`.
Current behavior:    One page.tsx out of 94 performs any server-side data fetching; the other 93
                      resolve their data client-side after hydration, each on its own
                      mount → useQuery waterfall, with no opportunity for RSC-level
                      parallelization because there is no server-rendered data tree to
                      parallelize.
Recommended solution: Not a per-file fix — this is the root-cause blocker called out in the
                      existing modernization notes. Introduce a server-safe token source (cookie
                      read via `next/headers`, or a server-only fetch wrapper) so authenticated
                      GET requests can run in Server Components, then convert read-heavy pages to
                      the `books/page.tsx` prefetch + `HydrationBoundary` pattern with parallel
                      `Promise.all` prefetches. Out of scope for this audit to execute.
Risk:                 Low to assess (read-only finding); the fix itself is a structural
                      migration with real risk (auth model change) — track separately.
Verification method: `grep -rL "'use client'" src/app --include=page.tsx | wc -l` (currently 4,
                      3 of which are trivial redirects) vs total `page.tsx` count (94).
Status:               Open
```

```
Rule:                client-swr-dedup
Issue:
Location:            src/features/auth/auth-provider.tsx:83-107 (local `user` state, sourced from
                      `readStoredUser()`/localStorage, never a react-query cache entry);
                      src/features/account/hooks/use-account-api.ts:44-51 (`useBackendProfile`,
                      a separate `useQuery({ queryKey: accountKeys.profile(), queryFn:
                      getBackendProfile })`); consumed together in
                      src/features/account/components/account-sections/profile-page.tsx:17,27-30
Severity:             P1
Why it matters:      The rule's point (SWR/react-query dedup by key) only works when all
                      consumers of a given piece of data go through the cache. `AuthContext.user`
                      is set once from `loginWithBackend()`/`readStoredUser()` and held in plain
                      `useState`, completely outside react-query — it is a second, independent
                      "current user" fetch path that the query cache cannot dedupe against.
                      `useBackendProfile()` is react-query-backed and correctly keyed under
                      `accountKeys.profile()`, but it is only used in `profile-page.tsx`. Every
                      other one of the 56 `useAuth()` call sites across the app reads the
                      unmanaged `user` state instead, so the same "current user" concept is
                      fetched/cached through two unsynchronized mechanisms.
Current behavior:    `profile-page.tsx:17` destructures `user` from `useAuth()` for initial field
                      values, and separately calls `useBackendProfile()` at line 27 for the same
                      profile — two different requests/caches for one entity. Elsewhere in the
                      app (header, dashboard, account shell, etc.) only the localStorage-backed
                      `AuthContext.user` is read, so if the backend profile changes (another
                      device, admin edit) nothing refetches it — there's no query invalidation
                      path into `AuthContext`, only the reverse (`updateProfile()` mutates local
                      state and localStorage directly, bypassing the query cache other than an
                      explicit `invalidateQueries` in `useUpdateBackendProfile`'s `onSuccess`,
                      use-account-api.ts:53-58).
Recommended solution: Make `useBackendProfile()` (react-query) the single source of truth for
                      the authenticated user; have `AuthContext` seed itself from and stay
                      subscribed to that query instead of maintaining parallel `useState` +
                      localStorage copies. `login`/`verifyRegistration` should call
                      `queryClient.setQueryData(accountKeys.profile(), user)` instead of a local
                      `setUser`.
Risk:                 Medium — `AuthContext` currently also carries non-backend demo state
                      (purchasedCourseIds, addresses, consultations, etc. — see
                      types.ts:53-90) that has no backend-profile equivalent yet; consolidating
                      needs to preserve that local-only state during the transition.
Verification method: Confirm `grep -rn "useAuth()" src --include=*.tsx | wc -l` (56) vs
                      `grep -rn "useBackendProfile" src` (2) call sites; after a fix, `user`
                      should resolve through one query.
Status:               Open
```

```
Rule:                client-localstorage-schema
Issue:
Location:            src/lib/storage/safe-local-storage.ts:1-11 (`STORAGE_KEYS`, 10 keys);
                      ~35 additional ad hoc `*_KEY` constants across `src/features/**/services/*.ts`
                      (see inventory below); only 4 of ~45 keys carry a version suffix
                      (`b3_blogs_v2`, `b3_researches_v3`, `b3_theories_v2`,
                      `b3-auth-accounts-v2` — src/features/auth/auth-storage.service.ts:6).
                      Concrete drift bug: src/features/auth/auth-provider.tsx:256 defines
                      `PAYMENTS_KEY = 'b3-payments-records'` (plural "payments") while the actual
                      payments store, src/features/payments/services/payments-storage.service.ts:8,
                      uses `PAYMENT_RECORDS_KEY = 'b3-payment-records'` (singular "payment") — two
                      different localStorage keys for what the code clearly intends to be the same
                      data set.
Severity:             P1
Why it matters:      This is exactly the failure mode the rule warns about: unversioned,
                      unmanaged keys invite schema/naming drift. Here it isn't hypothetical —
                      `deleteAccount()` (auth-provider.tsx:241-323) is a GDPR-style
                      "forget me" flow that reads `'b3-payments-records'`, filters out the
                      deleted user, and writes it back to anonymize payment history
                      (auth-provider.tsx:256-276). Because the real payments service writes to
                      `'b3-payment-records'` instead, `deleteAccount()` operates on a key that is
                      never populated by the app — the user's actual payment records at
                      `'b3-payment-records'` are never anonymized. A version/registry for keys
                      (single source of truth, like `STORAGE_KEYS`) would have made this
                      impossible; instead each service hand-rolls its own key constant.
Current behavior:    ~45 distinct localStorage keys are defined across 27 service files with no
                      central registry (`STORAGE_KEYS` in safe-local-storage.ts only covers 10 of
                      them) and no version scheme beyond 4 keys that happen to have a `_v2`/`_v3`
                      suffix baked into the literal.
Recommended solution: Consolidate all keys into one registry (extend `STORAGE_KEYS`), require a
                      version suffix on every key, and add a lint rule or code-review checklist
                      item against literal key strings outside that registry. Fix the
                      `b3-payments-records`/`b3-payment-records` mismatch immediately — either
                      point `auth-provider.tsx` at `PAYMENT_RECORDS_KEY` from the payments service,
                      or better, have `deleteAccount()` call the payments service's own anonymize
                      function instead of reimplementing storage access inline.
Risk:                 Low to fix the key mismatch (one-line key correction); revisit whether any
                      already-anonymized-in-appearance user has actually had their payment PII
                      retained, since the bug has presumably been live since the payments feature
                      shipped.
Verification method: `grep -rn "b3-payments-records\|b3-payment-records" src` shows both keys are
                      real and different; after the fix, `deleteAccount()` should filter the same
                      key the payments service reads/writes.
Status:               Open
```

```
Rule:                client-localstorage-schema
Issue:
Location:            src/features/account/services/account-records.service.ts:34-38,40-57
                      (`b3-account-notifications`, prepend-forever, no cap);
                      src/features/community/services/community-chat-storage.service.ts:16,58-72
                      (`b3-community-chat-messages`, single global array for every user's
                      messages, appended forever);
                      src/features/care/services/consultation-chat-storage.service.ts:21-44
                      (`b3-consultation-chat-messages`, same pattern, may include file
                      `attachment` data — consultation-chat-storage.service.ts:6-9);
                      also unbounded on the same pattern: `b3-health-assessment-records`,
                      `b3-admin-health-assessment-queue`, `b3-payment-records`,
                      `b3-payment-intents`, `b3-course-progress`, `b3-course-enrollments`,
                      `b3-quiz-attempts`, `b3-book-purchases`, `b3-print-orders`,
                      `b3-care-consultation-records`, `b3-care-trip-records`,
                      `b3-care-clinic-booking-records`, `b3-care-package-session-records`,
                      `b3-subscription-history`, `b3-cooperation-requests`,
                      `b3-newsletter-subscriptions`, `b3-newsletter-campaigns`,
                      `b3-account-favorites`
Severity:             P2
Why it matters:      The rule calls for minimal, bounded localStorage payloads. Every "records"
                      or "messages" store in this app is a single global JSON array, written with
                      `writeLocalStorageJson(KEY, [newItem, ...all])` (or `[...all, newItem]`) and
                      never trimmed, paginated, or capped. `b3-community-chat-messages` and
                      `b3-consultation-chat-messages` in particular store every chat message ever
                      sent, by every user sharing the browser profile, under one un-scoped key —
                      each write re-serializes and re-persists the entire history synchronously
                      on the main thread. This is a demo/local-mock persistence layer (per the
                      `MOCK_OTP`/"demo shell" comments in auth-storage.service.ts), but it is live
                      in the shipped app and its growth is unbounded for as long as a browser
                      profile is used.
Current behavior:    No key in this group applies a cap, TTL, or rolling-window trim. Data volume
                      grows linearly with usage for the lifetime of the localStorage entry
                      (5-10MB browser quota per origin).
Recommended solution: For anything meant to survive as a genuine local cache, cap array length
                      (e.g. keep last N notifications/messages) or move to IndexedDB, which does
                      not have localStorage's small synchronous quota. Longer term, this whole
                      layer is a mock backend standing in for real API-backed
                      notifications/chat/records — the correct fix is migrating each of these to
                      the corresponding `*-api.service.ts` + react-query hook, matching the
                      pattern already used for books/courses/care, and deleting the localStorage
                      version entirely.
Risk:                 Low (read-only observation); capping arrays without also migrating truncates
                      history a user may expect to see (e.g. past notifications), so coordinate
                      with product before trimming existing data.
Verification method: `grep -rn "writeLocalStorageJson(.*\[.*\.\.\." src/features` — every hit
                      prepends/appends without a `.slice()`/cap.
Status:               Open
```

```
Rule:                client-localstorage-schema
Issue:
Location:            src/features/auth/auth-storage.service.ts:114-118 (`readStoredUser`/
                      `saveStoredUser` persist the full `User` object, defined at
                      types.ts:53-90, under `STORAGE_KEYS.user` = `'b3_user'`);
                      src/components/ui/image-upload.tsx:27-32 (`FileReader.readAsDataURL`
                      produces a base64 data URI for `avatar`);
                      src/features/account/components/account-sections/profile-page.tsx:41
                      (`updateProfile({ name, phone, avatar: avatarPreview || undefined })` — the
                      non-backend-profile fallback path passes the raw base64 preview straight
                      into the persisted user, unlike the backend path at line 37 which stores
                      the server-returned image URL)
Severity:             P2
Why it matters:      The rule's "store minimal fields from server responses" example is
                      this exact shape: a 20+ field object persisted whole instead of the 1-2
                      fields the UI actually needs from localStorage (session continuity really
                      only needs id/name/role/avatar-url). `User` (types.ts:53-90) additionally
                      carries `addresses`, `consultations`, `trips`, `clinicBookings`,
                      `courseInstallments`, `purchasedCourseIds`, `completedQuizIds`, etc. — all
                      serialized into `b3_user` on every `setUser` call
                      (auth-provider.tsx:105-107, `useEffect(() => saveStoredUser(user), [user])`).
                      Because `ImageUpload` hands back a base64 data URI directly
                      (image-upload.tsx:30) and `saveProfile()` in profile-page.tsx falls back to
                      `updateProfile({ ..., avatar: avatarPreview })` whenever `hasBackendProfile`
                      is false (profile-page.tsx:30,41), that base64 string — potentially
                      hundreds of KB for a photo — can end up written into `b3_user` unminimized,
                      unlike the backend-profile path which stores the small server-side image URL
                      (profile-api.service.ts:67, `avatar: input.image`).
Current behavior:    The entire `User` object, not a minimal projection, is the unit of
                      localStorage persistence; the avatar field can be either a short URL or a
                      full base64 image depending on which of the two `saveProfile()` branches ran.
Recommended solution: Persist only the fields the app needs for session bootstrap before the
                      first backend profile fetch resolves (id, name, role, avatar URL), and
                      reject/short-circuit base64 avatars before they reach `updateProfile`/
                      localStorage — upload should always go through the backend image endpoint
                      (as the `hasBackendProfile` branch already does) rather than falling back to
                      storing the raw data URI.
Risk:                 Low to assess; fixing requires auditing every `updateProfile()` caller for
                      fields it actually relies on from localStorage vs. from live queries.
Verification method: Inspect `localStorage.getItem('b3_user')` in a browser session after using
                      the non-backend-profile fallback path with an uploaded avatar; payload size
                      will show the embedded base64 string.
Status:               Open
```

---

## Rules checked — no violations

- `server-auth-actions` — no Server Actions (`grep -rn "'use server'" src` = 0 hits) and no route
  handlers (`src/app/api/` does not exist) anywhere in `src/`, so this rule has no surface in the
  current codebase. All mutations go through `apiFetch` calls to the external Laravel backend
  (`https://portal.b3.raiyan.cc/`), which is out of scope.
- `server-cache-react` — `React.cache()` is unused (`grep -rn "\bcache(" src` = 0), and given the
  one server-rendering page (`books/page.tsx`) only issues two independent `fetch`-based calls
  (already deduped by Next.js's built-in fetch memoization per the rule's own note), there is no
  non-fetch server work (DB query, auth check, heavy compute) anywhere in `src/` to benefit from
  it. Doesn't apply to this app's current architecture.
- `server-cache-lru` — no cross-request server-side cache exists or is needed; the app performs no
  server-side data fetching outside the one `books/page.tsx` prefetch of public data. Doesn't
  apply.
- `server-hoist-static-io` — no route handlers, no OG-image generation, no server-side static
  asset/config loading anywhere in `src/`. Doesn't apply.
- `server-no-shared-module-state` — checked all module-level mutable bindings
  (`grep -rn "^let \|^var "` under `src/`); found only
  `src/lib/query/get-query-client.ts:43` (`let browserQueryClient`), which is the official
  TanStack Query singleton pattern, correctly guarded by `isServer` (`get-query-client.ts:45-51`)
  so a fresh client is always created per server request and the module-level variable is only
  ever reused client-side. No request data is stored at module scope. Clean.
- `server-dedup-props` — the only RSC→client boundary that passes data at all is
  `books/page.tsx` → `BooksPageClient`, and `BooksPageClient` takes no props (data flows via
  `dehydrate(queryClient)`/`HydrationBoundary` instead). The two prefetched queries
  (`getApiBooks()`, `getApiFeaturedBooks(4)`, books-api.service.ts:107-119) are independent
  network calls, not a value derived from the other via `.filter()`/`.map()`/spread, so there is
  no duplicate-serialization pattern to find.
- `server-serialization` — same narrow surface as above; no evidence of over-fetched fields being
  passed across the boundary (`mapBook()` already projects backend responses before they reach
  the client, books-api.service.ts:111,118).
- `server-parallel-nested-fetching` — no nested per-item dependent-fetch pattern exists in any RSC
  tree (there is effectively one RSC data-fetching tree in the app, and it has no nesting).
  Doesn't apply.
- `server-after-nonblocking` — no route handlers or Server Actions exist to schedule non-blocking
  work from (`grep -rn "\bafter(" src` = 0 hits, and none of the prerequisite mutation endpoints
  exist server-side). Doesn't apply.
- `client-event-listeners` — every `addEventListener` in `src/` (confirm-dialog.tsx:36,
  book-reader.tsx:55, podcast-player-provider.tsx:108-109) is registered by a component that is
  mounted at most once at a time (a modal dialog, the book-reader page, and a single app-wide
  podcast provider), not by a hook reused across many simultaneous instances — the rule's target
  pattern (`useKeyboardShortcut` used N times → N listeners) doesn't occur here. All listeners are
  correctly removed in their `useEffect` cleanup.
- `client-passive-event-listeners` — no `touchstart`/`touchmove`/`wheel`/`scroll` listeners exist
  anywhere in `src/` (`grep -rn "addEventListener" src` returns only `keydown`, `contextmenu`,
  `pause`, and `timeupdate`, none of which are the passive-eligible scroll-blocking event types
  this rule targets). Doesn't apply.

---

## localStorage key inventory (client-localstorage-schema)

All keys found via `grep -rn "_KEY = '" src` plus `STORAGE_KEYS` in
`src/lib/storage/safe-local-storage.ts:1-11`. "Versioned" = literal key has a `_v2`/`v3`-style
suffix. "Unbounded" = value is an array appended/prepended to with no cap.

| Key | Source | Versioned | Unbounded array risk |
|---|---|---|---|
| `b3_api_token` | auth-api.service.ts | No | No (single string) |
| `b3_user` | STORAGE_KEYS.user | No | No, but unminimized (see finding) |
| `b3_lang` | STORAGE_KEYS.language | No | No |
| `b3_currency` | STORAGE_KEYS.currency | No | No |
| `b3_blogs_v2` | STORAGE_KEYS.blogs | Yes | Yes (content list, not user-driven growth) |
| `b3_researches_v3` | STORAGE_KEYS.researches | Yes | Yes |
| `b3_theories_v2` | STORAGE_KEYS.theories | Yes | Yes |
| `b3_course_comments` | STORAGE_KEYS.courseComments | No | Yes |
| `b3_academy_reviews` | STORAGE_KEYS.reviews | No | Yes |
| `monograph_favorites` | STORAGE_KEYS.monographFavorites | No | Yes (id list, low risk) |
| `b3_newsletter_dismissed` | STORAGE_KEYS.newsletterDismissed | No | No |
| `b3-pending-intent` | pending-intent.service.ts | No | No |
| `b3-account-favorites` | account-records.service.ts | No | **Yes** |
| `b3-account-notifications` | account-records.service.ts | No | **Yes** |
| `b3-health-assessment-records` | account-records.service.ts | No | **Yes** (medical data) |
| `b3-admin-health-assessment-queue` | account-records.service.ts | No | **Yes** |
| `b3-assistant-config` | assistant-config.service.ts | No | No |
| `b3-auth-accounts-v2` | auth-storage.service.ts | Yes | **Yes** (every local demo account) |
| `b3-book-reading-positions` | book-content.service.ts | No | Grows per-book, unbounded users |
| `b3-book-purchases` | book-purchase.service.ts | No | **Yes** |
| `b3-print-orders` | book-purchase.service.ts | No | **Yes** |
| `b3-book-config` | books.service.ts | No | No (config object) |
| `b3-book-content` | books.service.ts | No | No (map, admin-authored) |
| `b3-care-clinics-data` | care-data.service.ts | No | No (seed/admin data) |
| `b3-care-consultation-packages` | care-data.service.ts | No | No |
| `b3-care-trip-packages` | care-data.service.ts | No | No |
| `b3-care-doctors` | care-data.service.ts | No | No |
| `b3-care-consultation-records` | care-records-storage.service.ts | No | **Yes** |
| `b3-care-trip-records` | care-records-storage.service.ts | No | **Yes** |
| `b3-care-clinic-booking-records` | care-records-storage.service.ts | No | **Yes** |
| `b3-care-package-session-records` | care-records-storage.service.ts | No | **Yes** |
| `b3-consultation-chat-messages` | consultation-chat-storage.service.ts | No | **Yes** (global, all consultations, may include attachments) |
| `b3-care-availability-slots` / `-booked` | slot-repository.service.ts | No | Grows with bookings |
| `b3-trip-capacity` | trip-capacity.service.ts | No | No (map) |
| `b3-community-chat-messages` | community-chat-storage.service.ts | No | **Yes** (global, all users) |
| `b3-cooperation-requests` | cooperation-request.service.ts | No | **Yes** |
| `b3-health-assessment-prompt-skipped` | health-assessment-prompt.service.ts | No | No (map) |
| `b3-device-id` | language-api.service.ts | No | No |
| `b3-course-progress` | course-progress.service.ts | No | **Yes** |
| `b3-course-enrollments` | enrollment.service.ts | No | **Yes** |
| `b3-quiz-attempts` | quiz-attempt.service.ts | No | **Yes** |
| `b3-newsletter-subscriptions` | newsletter-storage.service.ts | No | **Yes** |
| `b3-newsletter-campaigns` | newsletter-storage.service.ts | No | **Yes** |
| `b3-payment-records` | payments-storage.service.ts | No | **Yes** |
| `b3-payment-intents` | payments-storage.service.ts | No | **Yes** |
| `b3-payments-records` | auth-provider.tsx (dead/mismatched key — see finding) | No | N/A — orphaned key |
| `b3-podcast-playback` | podcasts.service.ts | No | No (single object, overwritten) |
| `b3-subscription-history` | subscription-history.service.ts | No | **Yes** |

~45 keys total, 4 versioned, ~20 with unbounded array growth risk, all wrapped in try/catch
(safe-local-storage.ts:17-40) but none behind runtime schema validation — every read is an
unchecked `JSON.parse(raw) as T` (safe-local-storage.ts:43-51).
