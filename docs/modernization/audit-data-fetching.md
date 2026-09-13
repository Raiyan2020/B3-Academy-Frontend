# Data-Fetching Audit — B3 Academy Frontend

Scope: `src/lib/api/`, `src/lib/query/`, `src/features/**`, `src/app/**`. Read-only audit, no code changed.

Conventions measured against: `AGENTS.md`, `.cursor/react-query.md`, `.cursor/server-first.md`.

Stack confirmed from `package.json`: Next 16.2, React 19.2, TypeScript 5.8, `@tanstack/react-query` 5.101, `react-hook-form` 7.80, `zod` 4.4.

---

## 1. Shared fetch client & QueryClient config

**`src/lib/api/base-fetch.ts`** — single `apiFetch<T>()` wrapper around `fetch`. Resolves base URL from `NEXT_PUBLIC_API_BASE_URL` (fallback hardcoded prod URL), normalizes legacy `/api/user`, `/api/general` paths to `/api/v1/...`, appends query params, unwraps the backend's `{ data, msg, key, errors }` envelope, and throws a typed `ApiError` (`src/lib/api/api-error.ts`) on non-2xx or network failure. `credentials: 'omit'` is set explicitly — the API is pure bearer-token, no cookies.

**`src/lib/api/api-error.ts`** — `ApiError` class + `getApiErrorMessage()` maps known `key`/`status` combinations (`network_error`, `unauthenticated`, `subscription_required`, `comments_not_allowed`, 404, 422 validation) to user-facing strings. Clean, centralized, correctly typed.

**`src/lib/api/download.ts`** — separate authenticated-blob-download helper, duplicates the token/language header logic from `base-fetch.ts` (see finding below).

**`src/lib/query/get-query-client.ts`** — `getQueryClient()` follows the official Next.js App Router pattern correctly: `isServer` branch always makes a fresh `QueryClient` (no cross-request leakage), browser branch memoizes a singleton. `defaultOptions.queries.staleTime = 60_000`, `retry: 1`. Global error handling is centralized via `QueryCache.onError` / `MutationCache.onError`/`onSuccess`, exactly as `.cursor/react-query.md` §1 requires — no component-level `toast.error()` calls were found alongside query/mutation hooks. `dehydrateOptions()` correctly extends `defaultShouldDehydrateQuery` to also dehydrate pending queries, which is the right call for `prefetchQuery` + `HydrationBoundary` (Next 15/16, React Query v5 pattern).

**`src/lib/query/provider.tsx`** — thin `QueryClientProvider` wrapper, correct.

This layer is well-built and mostly follows v5 idioms — `keepPreviousData` is used via `placeholderData: keepPreviousData` (not the deprecated v5-removed boolean) in the two paginated hooks that need it (`use-account-payments.ts`, `use-global-search.ts`). No `queryOptions()` factory usage anywhere, no `useSuspenseQuery`, no `throwOnError` — not necessarily wrong, just unused v5 features (noted, not flagged as a defect).

---

## 2. Auth/token handling in the fetch layer (scope item 8)

```
Issue:            Bearer token is readable only client-side (localStorage), making server-side authenticated fetch/prefetch structurally impossible
Location:         src/lib/api/base-fetch.ts:65-68 (getStoredToken), src/features/auth/services/auth-api.service.ts:79-93 (setStoredApiToken/getStoredApiToken)
Severity:         P0
Why it matters:   .cursor/server-first.md mandates "Data MUST be fetched on the server using QueryClient.prefetchQuery" for every server page. But the only credential apiFetch can attach — window.localStorage.getItem('b3_api_token') — is guarded by `if (typeof window === 'undefined') return undefined;`, so it is always undefined during SSR/RSC execution. Any server-side prefetchQuery of a user-scoped endpoint (profile, notifications, dashboard, orders, health assessments, etc.) will hit the API unauthenticated, get a 401/redirect-shaped envelope, and that failed/anonymous result gets dehydrated into the client cache. This is very likely the reason 89 of 90 "use client" pages exist (see finding in §5) — the architecture cannot support the server-first mandate for anything requiring auth.
Current behavior: Token stored via window.localStorage.setItem('b3_api_token', ...) in auth-api.service.ts; a separate, non-credential `document.cookie = 'b3_session=<role>'` exists (src/features/auth/auth-storage.service.ts:120) but is never read by base-fetch.ts or any server code — no middleware.ts exists in the repo to consult it either.
Recommended solution: Move the source of truth for the bearer token to an httpOnly cookie set by the backend (or a same-site proxy route) so both `apiFetch` (server) and a Next.js middleware can read it. Short of a backend change, at minimum mirror the token into a (non-httpOnly, still visible-to-XSS) cookie read by a server-side variant of getStoredToken() via `next/headers` cookies(), so prefetchQuery calls for authenticated data can attach it.
Risk:             Cross-cutting change — touches auth issuance/storage, every server prefetch call site, and CSRF/cookie SameSite considerations.
Verification method: Prefetch an authenticated endpoint (e.g. account profile) from a server component after the change and confirm the dehydrated query has real data, not a 401 ApiError, on first paint with no client refetch flash.
Status:           Open
```

```
Issue:            Auth bearer token stored in plain localStorage, not httpOnly cookie
Location:         src/features/auth/services/auth-api.service.ts:79-93; read at src/lib/api/base-fetch.ts:65-68 and src/lib/api/download.ts:10
Severity:         P1
Why it matters:   Standard XSS-exposure concern: any injected script (a third-party widget, a dependency, a stored-XSS bug in rendered user content) can read `localStorage.getItem('b3_api_token')` and exfiltrate a live session credential. This is a known trade-off, not necessarily "wrong" for this app's threat model, but it's undocumented and worth an explicit decision.
Current behavior: `window.localStorage.setItem('b3_api_token', token)` on login/register/verify; every apiFetch call reads it back and sends `Authorization: Bearer <token>`.
Recommended solution: If migrating to httpOnly cookies (see P0 above) isn't feasible short-term, document the accepted risk and ensure no user-generated HTML is ever rendered unsanitized anywhere in the app (out of this audit's scope to verify).
Risk:             None for documenting; real for migrating (see P0 above).
Verification method: Security review / dependency audit for XSS surfaces.
Status:           Open
```

```
Issue:            Token/language header logic duplicated between base-fetch.ts and download.ts
Location:         src/lib/api/download.ts:10-18 vs src/lib/api/base-fetch.ts:65-76, 99-112
Severity:         P3
Why it matters:   Two independent copies of "read b3_api_token / b3_lang from localStorage and build headers" will drift — e.g. base-fetch.ts already has richer error handling (ApiError with status/key) that download.ts's plain `throw new Error(...)` doesn't share.
Current behavior: downloadAuthenticatedFile() re-implements token/language retrieval inline instead of importing a shared helper.
Recommended solution: Extract `getStoredToken`/`getStoredLanguage` from base-fetch.ts into a small shared module both files import.
Risk:             Low — pure refactor, same runtime behavior.
Verification method: Unit test / manual download-flow smoke test after refactor.
Status:           Open
```

---

## 3. Server prefetch + HydrationBoundary usage (scope item 5)

```
Issue:            Server-first prefetch pattern is used on 1 of 94 pages despite being a stated hard convention
Location:         All of src/app/**/page.tsx (94 files); only src/app/(site)/books/page.tsx:1-19 implements prefetchQuery + HydrationBoundary
Severity:         P1
Why it matters:   .cursor/server-first.md: "Data MUST be fetched on the server using QueryClient.prefetchQuery" and "Wrap the prefetched data in <HydrationBoundary>". AGENTS.md repeats "Server pages prefetch with prefetchQuery + HydrationBoundary". 90 of the 94 page.tsx files carry `'use client'` directly (verified: `grep -l "'use client'" **/page.tsx` → 90 matches); the remaining 4 are src/app/(account)/settings/page.tsx and src/app/(admin)/admin/page.tsx (both bare `redirect()`, no data), src/app/(site)/courses/page.tsx (a server component that renders a client component with zero prefetch), and src/app/(site)/books/page.tsx (the only correct implementation). Every other route — course catalog, course detail, clinic list, encyclopedia, monograph, trips, podcasts, community, home page, etc. — fetches entirely client-side via `useQuery` inside `'use client'` page trees, meaning first paint always shows a loading skeleton/spinner instead of server-rendered content, and there is no HTML with real data for crawlers or LCP.
Current behavior: e.g. src/app/(site)/courses/page.tsx: `export default function Page() { return <CoursesPageClient />; }` with no prefetch — CoursesPageClient (src/app/(site)/courses/courses-page-client.tsx) is 'use client' and renders <CourseCatalog/>, which calls useCoursesQuery() (client-side fetch).
Recommended solution: For public, non-authenticated content (courses catalog/detail, clinic list, encyclopedia, monograph, trips, podcasts, site-content pages), follow the books/page.tsx pattern: server page calls `queryClient.prefetchQuery(...)` for the feature's list/detail queries and wraps the client shell in `<HydrationBoundary state={dehydrate(queryClient, dehydrateOptions())}>`. This is blocked for authenticated pages (dashboard, account, admin, doctor) until the P0 token-handling issue above is resolved.
Risk:             Moderate per-page effort; must be done feature-by-feature since each has different query keys/service calls. Low risk of regression since HydrationBoundary is additive (client useQuery still runs, just against a warm cache).
Verification method: For each migrated page, confirm view-source contains the fetched data (no client-only fetch flash) and that the client useQuery reports `isFetched: true`/no loading spinner on first paint.
Status:           Open
```

```
Issue:            Reference implementation is correct
Location:         src/app/(site)/books/page.tsx:1-19
Severity:         N/A (positive finding)
Why it matters:   Confirms the team knows the correct pattern; this file should be the template for the P1 rollout above. Uses `Promise.all` for its two prefetches — no waterfall.
Current behavior: `await Promise.all([queryClient.prefetchQuery(...), queryClient.prefetchQuery(...)])` then `<HydrationBoundary state={dehydrate(queryClient, dehydrateOptions())}><BooksPageClient /></HydrationBoundary>`.
Recommended solution: N/A — replicate this pattern elsewhere.
Risk:             N/A
Verification method: N/A
Status:           Open (informational)
```

---

## 4. `useEffect`-based fetching (scope item 3)

Searched every file containing `useEffect` for co-located `fetch(`, `apiFetch`, `*Service.`/`*Api(`, `await ...service`, `.then(`, or `axios.` calls.

**Result: no `useEffect` performs a network fetch directly.** All server-state reads go through TanStack Query hooks (`useQuery`/`useMutation`). The only `useEffect` bodies found alongside data-shaped code are:

- `src/features/health-assessment/components/health-assessment-page.tsx:58-69` and `health-assessment-form.tsx:44-54` — seed a `react-hook-form` default value from `formQuery.data` once the query resolves (`form.reset({...})` keyed on `[sections]`). This is a derived-state-from-query-data effect, not a fetch. It's a defensible pattern for one-time form seeding but is exactly the shape React docs warn about ("adjusting state when a prop changes") — could be replaced with a `key`-prop remount or computing defaultValues lazily, but it's low risk as-is.
- `src/features/auth/auth-provider.tsx:84-102` — two effects: one reads the locally-cached user from storage on mount (not a network call), one persists `user` back to storage on every change. Not react-query-managed at all (see §6 classification note).
- `src/features/account/components/account-sections/newsletter-page.tsx:43-48` — syncs local `status`/`email` state from `backendStatus` (react-query data), same derived-state-effect shape as health-assessment above.

None of these rise to a P0/P1 "fetch-in-useEffect" anti-pattern; they're all effects reacting to already-fetched query data, not the effect performing the fetch itself. No finding filed for this category beyond the note above.

---

## 5. Data-fetching pattern inventory (scope item 2)

| Pattern | Where | Notes |
|---|---|---|
| Client-side server state (react-query) | `src/features/*/hooks/use-*.ts` (21 hook files call `useQuery(`) | Dominant pattern app-wide; almost all pages are `'use client'` and fetch through these hooks. |
| Server-side data (RSC + prefetch) | `src/app/(site)/books/page.tsx` only | See §3 P1 finding — should be far more common. |
| Local UI state | `useState` for modals, form-page index, OTP countdown, etc., throughout `src/features/**/components/` | Correctly scoped, not a concern. |
| Global client state (non-react-query) | `src/features/auth/auth-provider.tsx` (`AuthContext` + `useState<User|null>`, persisted to localStorage, not react-query); root `LanguageContext.tsx`, `CurrencyContext.tsx` (legacy root-level, still imported by ~96 files) | Auth session/user object is hand-rolled state synced to storage rather than a react-query-managed resource — reasonable for a client-only session object, but note it duplicates data also available via `accountKeys.profile()` (`useBackendProfile`), so "who is the user" has two independent sources of truth (see finding below). |
| Form state | `react-hook-form` via `src/lib/forms/use-app-form.ts` + `zod` schemas | Consistent, matches stack. |
| URL state | `useSearchParams`/route params for filters (e.g. `health-assessment-page.tsx:34-35`, clinic/course filters) | Standard `next/navigation` usage, no issues found. |

```
Issue:            Two independent sources of truth for "current user" (AuthContext local state vs react-query accountKeys.profile())
Location:         src/features/auth/auth-provider.tsx:82-98 (AuthContext user state) vs src/features/account/hooks/use-account-api.ts:44-51 (useBackendProfile via accountKeys.profile())
Severity:         P2
Why it matters:   `AuthProvider`'s `user` is set once from `readStoredUser()` (localStorage) on mount and updated ad hoc by `setUser()` calls scattered through login/updateProfile/etc. Meanwhile `useBackendProfile()` independently fetches the same person's profile from the API into the react-query cache. Nothing keeps these two in sync: a profile edit through `useUpdateBackendProfile()` (which invalidates `accountKeys.profile()`) does not update `AuthContext.user`, and vice versa. Components reading `useAuth().user` and components reading `useBackendProfile().data` can disagree after either one changes.
Current behavior: `updateProfile()` in auth-provider.tsx:218-225 calls the legacy localStorage `updateAuthAccount()` helper and manually spreads `input` into local state — it does not call the backend `useUpdateBackendProfile` mutation at all, so the two "profile update" code paths (one in AuthContext, one in the account feature's react-query hooks) appear to be entirely separate systems.
Recommended solution: Make `AuthContext.user` derive from `useBackendProfile()`'s query data (react-query becomes the single source of truth for the authenticated profile), or explicitly document that AuthContext.user is session-shape-only and profile *content* always comes from `useBackendProfile()`.
Risk:             Behavior-changing — likely surfaces existing staleness bugs (profile page not reflecting name changes elsewhere) as this is untangled.
Verification method: Edit a profile field via the account settings mutation and confirm every surface reading `useAuth().user` (header avatar/name, etc.) updates without a full reload.
Status:           Open
```

```
Issue:            Newsletter management page mixes a legacy localStorage-backed newsletter system with the new backend react-query one
Location:         src/features/account/components/account-sections/newsletter-page.tsx:1-143 (imports both src/features/newsletter/services/newsletter-storage.service.ts functions and use-account-api.ts's useBackendNewsletter/useBackendNewsletterActions)
Severity:         P2
Why it matters:   Every handler (`handleRequest`, `handleVerify`, `handleResend`, `handleUnsubscribe`) branches on `hasBackendNewsletter` and, when false, falls through to a fully separate localStorage-only implementation (`requestNewsletterSubscription`, `confirmNewsletterSubscription`, hardcoded test OTP `'123456'` at line 94). This is dead/demo code left alongside the real integration; it's dual-maintained and a source of confusion about which path actually runs in production (`hasBackendNewsletter = backendNewsletter.isFetched && !backendNewsletter.isError`, so the fallback only fires if the backend call errors or hasn't resolved — meaning during any transient API hiccup a user could be silently routed into the fake local flow).
Current behavior: See handlers at newsletter-page.tsx:60-143.
Recommended solution: Once the backend newsletter API is confirmed live for all environments, delete the localStorage fallback branch entirely.
Risk:             Low if backend availability is confirmed; removes a safety net for backend outages otherwise.
Verification method: grep for other consumers of newsletter-storage.service.ts before deleting; confirm no environment still depends on the local-only path.
Status:           Open
```

---

## 6. Query key factories (scope item 4)

`.cursor/react-query.md` §2 and `AGENTS.md` both say "Every feature MUST have a `query-keys.ts` file in its root" and "never inline string arrays."

12 of 29 feature directories have a root `query-keys.ts`: `account`, `books`, `clinic`, `community`, `consultations`, `courses`, `health-assessment`, `library`, `podcasts`, `search`, `site-content`, `trips`.

```
Issue:            Query-key factories exist but are misplaced/misnamed for several features, violating the "query-keys.ts at feature root" rule
Location:         src/features/reviews/hooks/platform-reviews.keys.ts, src/features/community/hooks/group-chat.keys.ts, src/features/consultations/hooks/... (partially — carePortalKeys is correctly in src/features/consultations/query-keys.ts), src/features/subscriptions/hooks/subscriptions.keys.ts, src/features/society/community-posts/hooks/community-posts.keys.ts, src/features/society/cooperation/hooks/cooperation.keys.ts, src/features/society/plants-fungi/hooks/plants-fungi.keys.ts, src/features/society/podcasts/hooks/podcasts.keys.ts
Severity:         P2
Why it matters:   The factory pattern itself is followed correctly everywhere (every key is built off a `xKeys.all` root array, no bare inline `['hotels']`-style literals were found as the primary key) — good adherence to the "no inline arrays" rule. But the *location* convention is broken: these 8 factories live in `hooks/*.keys.ts` instead of `<feature>/query-keys.ts`, and `subscriptions` and `reviews` have no `src/features/<name>/query-keys.ts` at all despite AGENTS.md requiring one per feature. This is inconsistent enough (12 correct vs 8+ non-conforming) that a new contributor has no single place to expect a feature's keys.
Current behavior: e.g. `import { platformReviewKeys } from './platform-reviews.keys';` inside src/features/reviews/hooks/use-platform-reviews.ts:6, instead of a feature-root src/features/reviews/query-keys.ts.
Recommended solution: Move each `hooks/*.keys.ts` file to `<feature>/query-keys.ts` (or, for the nested `society/<sub>` features, `<feature>/<sub>/query-keys.ts`), update imports.
Risk:             Pure file-move + import-path refactor, low risk, mechanical.
Verification method: `npm run typecheck` after the move catches any missed import.
Status:           Open
```

```
Issue:            Minor inline key extension outside the factory
Location:         src/features/books/hooks/use-books-api.ts:40, 47, 55, 68 (e.g. `queryKey: [...bookKeys.all, 'categories']`)
Severity:         P3
Why it matters:   `bookKeys.all` is used correctly as the root, but `'categories'`, `'mine'`, `'mine', orderId` segments are spread inline at the call site rather than being named methods on `bookKeys` (contrast with e.g. `courseKeys.mine()`, `courseKeys.myDetail()` in the same codebase, which do this properly). Functionally equivalent and still typo-safe via the spread of `.all`, but inconsistent with the sibling `courses` feature's more complete factory and slightly easier to fat-finger (`'mine'` vs `'Mine'`) since it's not centralized.
Current behavior: See lines above; `bookKeys` (src/features/books/query-keys.ts) lacks `.mine()`/`.categories()`/`.myOrder(id)` methods that these call sites improvise inline.
Recommended solution: Add the missing named methods to `bookKeys` and switch call sites to use them, matching the `courseKeys` pattern.
Risk:             None — additive, mechanical.
Verification method: Compare resulting key arrays are identical (same runtime keys) before/after.
Status:           Open
```

---

## 7. Duplicated/parallel requests, waterfalls, `Promise.all` (scope item 6)

Only one server component performs prefetching (`books/page.tsx`), and it already uses `Promise.all` correctly for its two prefetch calls — no server-side waterfall exists (because there's almost no server-side fetching at all; see §3).

Client-side: searched every `enabled:` option for a dependency on another query's `.data` (the shape of an intentional/accidental waterfall). Found exactly one:

- `src/features/society/community-posts/hooks/use-community-post-detail.ts:24` — `enabled: Boolean(id && detail.data?.canViewFullContent)` — the comments query is deliberately gated on the post detail query's `canViewFullContent` flag. This reads as an intentional business rule (don't fetch comments for gated content), not an accidental waterfall — no finding filed.

No other chained/dependent queries were found. Independent `useQuery` calls within the same component (e.g. `use-clinics-query.ts`'s categories/services/detail/workingHours/slots) fire in parallel by default (react-query does not serialize independent hooks), so no waterfall there either.

No finding filed for this section — the pattern found in the one server component is correct, and no client-side waterfalls were found.

---

## 8. Missing loading/error/empty states (scope item 7)

Spot-checked the `trips` feature (4 components, all reference `isLoading`/`isError`/`isPending`) and `health-assessment` (both components render explicit `isLoading`/`isError`/empty branches, see §4 excerpt) — both fully cover loading/error/empty. Given the consistent hook-based pattern (`useQuery` results consumed directly in the owning page component rather than deep prop-drilling), and that 21 files call `useQuery(` directly with local `isLoading`/`isError` branching visible in every file sampled, no systemic missing-state pattern was found in the areas sampled. A full component-by-component sweep of all ~90 client pages was out of budget for this pass — flagging as a residual risk rather than a filed defect.

```
Issue:            Not independently verified for every consuming component
Location:         N/A (scope note)
Severity:         P3
Why it matters:   This audit sampled representative features (trips, health-assessment, account, books) rather than exhaustively reading all ~90 page trees; a full sweep could surface isolated missing-state components not caught here.
Current behavior: N/A
Recommended solution: If a follow-up pass is wanted, grep for `useQuery(`/`use.*Query(` call sites whose returned `data` is rendered without a preceding `isLoading`/`isPending`/`isError` branch in the same component tree.
Risk:             N/A
Verification method: N/A
Status:           Open
```

---

## Summary

| Severity | Count |
|---|---|
| P0 | 1 |
| P1 | 1 |
| P2 | 3 |
| P3 | 3 |
| Informational (no action) | 2 |

The shared fetch client (`base-fetch.ts`), `ApiError` handling, and `QueryClient` global-error-toast setup are well-built and match `.cursor/react-query.md` closely — no findings there. The dominant problems are architectural: the app is almost entirely client-fetched (90/94 pages `'use client'`, 1/94 uses the mandated `prefetchQuery` + `HydrationBoundary` pattern) and the root cause is that auth tokens live only in `localStorage`, so server-side prefetch of anything authenticated cannot currently work at all (P0). Query-key factories are used correctly in spirit everywhere but are inconsistently located (8 features keep them under `hooks/*.keys.ts` instead of the mandated feature-root `query-keys.ts`).
