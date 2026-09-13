# TypeScript Type-Safety Audit

Read-only audit. No source files were modified. All commands were run from
the repo root (`C:\Users\abdallah\Desktop\ahmed\b3-acadmy`) against the
installed `node_modules` (TypeScript 5.8, via `npx tsc`).

Stack: Next 16.2 App Router, React 19.2, TypeScript 5.8, zod 4.4. Backend is
a separate Laravel REST API reached via `NEXT_PUBLIC_API_BASE_URL`
(`src/lib/api/base-fetch.ts`).

**Headline finding**: `tsconfig.json` has `"strict": false`, so
`strictNullChecks` is also off — this is where the real, runtime-relevant
bugs hide (null/undefined access), not where `--strict` error *counts* would
suggest. See "The count is misleading" below.

---

## strict-mode migration data

### Error counts by configuration

| Configuration | `error TS` count |
|---|---|
| Baseline (current `tsconfig.json`, `strict: false`) | **0** |
| `npx tsc --noEmit --strict` | **24** |

### `--strict` errors by TS code

| Code | Count | Meaning |
|---|---|---|
| TS18047 | 11 | `'x' is possibly 'null'` |
| TS2352 | 5 | Cast "may be a mistake" (neither type overlaps) |
| TS2339 | 4 | Property does not exist (mostly on inferred `never`) |
| TS18048 | 2 | `'x' is possibly 'undefined'` |
| TS7053 | 1 | Implicit `any` from indexing with a union key |
| TS2769 | 1 | No overload matches (zod resolver typing) |

### Per-flag counts (each run in isolation against the current baseline)

| Flag | Errors | Note |
|---|---|---|
| `--strictNullChecks` | **26** | Highest solo count — exceeds the full `--strict` count (24) because some errors overlap/change once other strict flags are combined |
| `--noImplicitAny` | **12** | |
| `--strictFunctionTypes` | **0** | Free |
| `--strictBindCallApply` | **0** | Free |
| `--noImplicitThis` | **0** | Free |
| `--useUnknownInCatchVariables` | **0** | Free |
| `--alwaysStrict` | **0** | Free |

### Error distribution by directory (`--strict`)

| Path | Errors |
|---|---|
| `src/features` | 22 |
| `src/lib` | 1 |
| `LanguageContext.tsx` (repo root, legacy) | 1 |

### Full `--strict` error list

```
LanguageContext.tsx(563,12): TS7053 — Language union indexes a 433-key literal object union
src/features/account/components/account-sections/newsletter-page.tsx(97,26): TS2339 'status' on 'never'
src/features/account/components/account-sections/newsletter-page.tsx(140,23): TS2339 'status' on 'never'
src/features/account/components/account-sections/newsletter-page.tsx(253,39): TS2339 'status' on 'never'
src/features/care/services/care-records-storage.service.ts(218,32): TS2339 'id' on 'never'
src/features/checkout/components/checkout-page.tsx(329,29..493,33): TS18047 'user' possibly null — 11 occurrences
src/features/community/components/community-chat.test.tsx(48,34): TS2352 mock cast to UseQueryResult
src/features/community/components/community-chat.test.tsx(52,30): TS2352 mock cast to UseQueryResult
src/features/courses/ui/course-flows.test.tsx(174,46): TS2352 mock cast to UseQueryResult
src/features/courses/ui/course-flows.test.tsx(175,52): TS2352 mock cast to UseQueryResult
src/features/courses/ui/course-flows.test.tsx(188,48): TS2352 mock cast to UseQueryResult
src/features/navigation/components/site-layout.tsx(77,20): TS18048 'item.items' possibly undefined
src/features/navigation/components/site-layout.tsx(125,26): TS18048 'item.items' possibly undefined
src/lib/forms/use-app-form.ts(11,27): TS2769 zodResolver overload mismatch
```

### The count is misleading

24 total `--strict` errors on a ~500-file `src/` tree looks like flipping
`strict: true` is nearly free. It is **not** a signal that the code is
type-sound — it means the app already routes backend JSON through `Record<string,
any>` (`type ApiObject = Record<string, any>`, 6 files) and hand-written
mapper functions (`text()`, `numberValue()`, `Boolean()`) *before* it ever
touches a "properly typed" variable. `strictNullChecks` can't flag what it
never sees as a checked type. The compiler-error count and the actual
type-safety risk are two different numbers — see Finding TS-002.

---

## Escape-hatch counts

Scanned `src/` (482 `.ts`/`.tsx` files) separately from the 15 repo-root
legacy files (`LanguageContext.tsx`, `BlogContext.tsx`,
`CourseCommentContext.tsx`, `CurrencyContext.tsx`, `ResearchContext.tsx`,
`TheoryContext.tsx`, `data.ts`, `types.ts`, `components/*.tsx` (6 files),
`services/geminiService.ts`) — both are type-checked because `tsconfig.json`
`include` covers `**/*.ts(x)` from the repo root, not just `src/`.

| Pattern | `src/` | repo-root legacy |
|---|---|---|
| `: any` | 1 | 0 |
| `<any>` | 0 | 0 |
| `as any` | 1 | 6 |
| `any[]` | 12 | 0 |
| `Record<string, any>` | 6 | 0 |
| Non-null assertion (`x!`) | 18 | 6 |
| `as unknown as` | 8 | 0 |
| `@ts-ignore` | 0 | 0 |
| `@ts-expect-error` | 0 | 0 |
| `@ts-nocheck` | 0 | 0 |

Worst offenders:
- `any[]`: `src/features/auth/auth-provider.tsx` — **12 of 12** occurrences (all `readLocalStorageJson<any[]>(...)`, see TS-004).
- `as any` (legacy root): `components/Layout.tsx` (3), `components/UI.tsx` (2), `LanguageContext.tsx` (1).
- Non-null assertion: `src/features/care/services/slot-repository.service.ts` (4), `checkout-page.tsx` (2), `use-clinics-query.ts` (2), `use-trips-api.ts` (2), plus 6 singles.
- `as unknown as`: concentrated in test files — `course-flows.test.tsx` (6), `BookCard.test.tsx` (1), `community-chat.test.tsx` (1) — all faking `UseQueryResult<T>` shapes (matches the TS2352 cluster above).
- `Record<string, any>`: exactly the 6 `*-api.service.ts` files that declare `type ApiObject = Record<string, any>` as the network boundary type (clinic, clinic-booking, courses, trips, care-portal, group-chat).
- No suppression comments (`@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`) exist anywhere in the repo — clean.

---

## Findings

### TS-001

```
Issue:                tsconfig.json disables `strict`, which disables `strictNullChecks`
Location:              tsconfig.json:17 (clickable: tsconfig.json)
Severity:              P0
Why it matters:        strictNullChecks alone accounts for 26 of the possible strict errors — the highest single-flag count — and directly maps to the checkout-page.tsx (11x TS18047 on `user`) and site-layout.tsx (2x TS18048) findings below, both real null/undefined access paths on live user data.
Current behavior:      `"strict": false` in compilerOptions; no strict sub-flag is individually enabled.
Recommended solution:  Stage the migration (see recommendation section) rather than flip `strict: true` blind — start with the 5 zero-cost flags, then strictNullChecks, then noImplicitAny, then full strict.
Risk:                  Low technical risk (measured cost is 24 errors total) but the count under-represents real risk — see TS-002.
Verification method:   `npx tsc --noEmit --strict 2>&1 | grep -c "error TS"` — track this number to zero per stage.
Status:                Open
```

### TS-002

```
Issue:                 apiFetch<T>() blind-casts all backend JSON to the caller-supplied generic with zero runtime validation
Location:              src/lib/api/base-fetch.ts:142, src/lib/api/base-fetch.ts:145
Severity:              P0
Why it matters:        Every network response in the app funnels through this one function. `strictNullChecks`/`strict` cannot catch this — `payload as T` and `(payload as ApiEnvelope<T>).data as T` are trusted unconditionally the moment the HTTP status is 2xx. If the Laravel backend changes a field, omits a key, or returns null where a type says string, nothing in the type system notices; it surfaces as a runtime crash deep in a mapper or component.
Current behavior:      `return (payload as ApiEnvelope<T>).data as T;` / `return payload as T;` — no zod schema, no shape check, no field validation anywhere in this file.
Recommended solution:  zod is already a project dependency (v4.4) and is proven to work here (see TS-010) — introduce per-endpoint zod schemas at the highest-traffic boundaries first (auth, checkout, payments) and `.parse()`/`.safeParse()` the payload before returning, replacing the blind cast.
Risk:                  Medium — schema drift between assumed and actual backend shape will surface as parse failures; roll out schema-by-schema, not repo-wide, and log/report `.safeParse` failures before hard-failing.
Verification method:   Add a schema for one endpoint, call it against a captured real response, confirm it parses; confirm a deliberately malformed payload is now caught before it reaches UI code.
Status:                Open
```

### TS-003

```
Issue:                 zod is installed and used for form validation, but never at the API response boundary
Location:              src/lib/forms/use-app-form.ts:1-11 (only real zod usage); 24 files call apiFetch<T>() with a plain TS generic and no schema (e.g. src/features/courses/services/courses-api.service.ts, src/features/trips/services/trips-api.service.ts)
Severity:              P1
Why it matters:        This confirms TS-002 is a systemic choice, not an oversight in one file — the tool needed to fix it is already a dependency and already proven in the codebase, it's just applied to the wrong boundary (client input, not server output).
Current behavior:      `grep -rn "from 'zod'" src` returns exactly 3 files, all under src/features/health-assessment/* and src/lib/forms/use-app-form.ts — all react-hook-form/zodResolver usage, none touching apiFetch.
Recommended solution:  Same as TS-002 — extend zod usage from "form input validation" to "network output validation".
Risk:                  Low (this is a scope observation, not a code change).
Verification method:   `grep -rln "z\.object\(" src` — the count should grow as endpoints get schemas.
Status:                Open
```

### TS-004

```
Issue:                 GDPR account-erasure code reads persisted user data typed as `any[]` and accesses fields with no runtime shape check
Location:              src/features/auth/auth-provider.tsx:247,252,275,279,283,287,291,295,299,303,307,311 (12 call sites, one function)
Severity:              P0
Why it matters:        This is the account-deletion / data-erasure path. `readLocalStorageJson<any[]>(KEY, [])` returns `any[]`, then the code does `.filter((item) => item.userId !== userId)` on every one of 10 different stored record types (payments, enrollments, quiz attempts, book purchases, clinic bookings, consultations, trips, favorites, notifications, newsletter). Any stored record whose shape drifted (e.g. missing `userId`, or historical data written by an older app version) silently fails to filter — user data meant to be deleted may survive, or the filter throws and the deletion partially completes. `strictNullChecks`/`noImplicitAny` cannot see this because `any[]` opts the whole array out of checking.
Current behavior:      `const allHealth = readLocalStorageJson<any[]>(HEALTH_ASSESSMENTS_KEY, []); writeLocalStorageJson(HEALTH_ASSESSMENTS_KEY, allHealth.filter((item) => item.userId !== userId));` — repeated with 9 other keys, same pattern, same `any[]`.
Recommended solution:  Each of the 10 storage keys already has a real record type declared under its owning feature's types.ts (e.g. StoredConsultationRecord in src/features/care/types/care.types.ts). Type `readLocalStorageJson` calls with those concrete types instead of `any[]`, and give `readLocalStorageJson` a runtime guard (zod schema per key, or at minimum an `Array.isArray` + shape check) so a corrupt/legacy record doesn't crash the erasure loop.
Risk:                  Low to fix (typing + a guard), but treat as urgent given this is a legally-relevant data-deletion path.
Verification method:   Unit test: seed localStorage with a malformed record missing `userId`, call the erasure function, assert it does not throw and does not retain data belonging to the target user.
Status:                Open
```

### TS-005

```
Issue:                 Two live, structurally-incompatible `SubscriptionPlan` interfaces share the same name in different features
Location:              src/features/business/business.types.ts:42 vs src/features/subscriptions/types/api.types.ts:18
Severity:              P0
Why it matters:        Same type name, same domain concept, incompatible shapes: business.types.ts has `name: LocalizedString`, `prices: Record<CurrencyCode, number>` (legacy mock-data shape); subscriptions/api.types.ts has `name: string`, `price: number`, `currency: string` (real API-mapped shape, matching what subscriptions-api.service.ts actually returns). Because both are structural TypeScript interfaces, an object satisfying one can be silently accepted where the other is expected in some call paths, and a developer importing the wrong `SubscriptionPlan` gets no compiler warning that they picked the legacy/mock version.
Current behavior:      Both interfaces are exported and presumably both are imported somewhere under `src/features/business` (legacy content-driven pages) and `src/features/subscriptions` (live API-backed pages) respectively.
Recommended solution:  Rename one — the business.types.ts one is the older, mock-data-era shape (it lives next to `CommunitySection`, `BusinessContentMeta` — general marketing-content types) and should be renamed to something like `SubscriptionPlanContent` or removed if the mock-data path it served is dead. Keep `SubscriptionPlan` as the single API-backed type.
Risk:                  Low — a rename plus updating its (likely small) import list.
Verification method:   `grep -rln "SubscriptionPlan" src/features/business` before/after; confirm no remaining ambiguous import resolves to the wrong file.
Status:                Open
```

### TS-006

```
Issue:                 CareBooking, CareBookingDetail, CareBookingListItem, BookingResult, InitialConsultationTypes, and InitialConsultationTypeOption are each declared identically (copy-pasted) in 2 different feature type files
Location:              CareBooking: src/features/clinic/types/api.types.ts:107 and src/features/trips/types/api.types.ts:79 (verified byte-identical field list); CareBookingDetail: src/features/consultations/types/api.types.ts:68 and src/features/trips/types/api.types.ts:227; CareBookingListItem: src/features/consultations/types/api.types.ts:36 and src/features/trips/types/api.types.ts:198; BookingResult: src/features/clinic/types/api.types.ts:149 and src/features/trips/types/api.types.ts:121; InitialConsultationTypes / InitialConsultationTypeOption: src/features/clinic/types/api.types.ts:84,75 and src/features/trips/types/api.types.ts:56,47
Severity:              P1
Why it matters:        Clinic bookings and trip-initial-consultation bookings clearly hit the same Laravel "care booking" resource — the two feature modules independently modeled the exact same 20-field response shape instead of sharing one. Every future backend field change to this resource has to be applied twice, in two features, with no compiler link between them; a fix in one and a forgotten fix in the other reintroduces drift silently (structural typing hides it).
Current behavior:      Verified via direct diff of the two `CareBooking` interfaces — identical field-for-field.
Recommended solution:  Extract a shared `src/features/care/types/care-booking.types.ts` (or similar shared location) for the booking/payment/consultation-type shapes both clinic and trips consume, and have both features import from it.
Risk:                  Medium-low — mechanical extraction, but touches both features' mapper functions (mapCareBooking in both clinics-api.service.ts and trips-api.service.ts are also duplicated logic, not just duplicated types) so budget time for the mapper consolidation too, not just the types.
Verification method:   After extraction, `tsc --noEmit` clean; grep confirms only one declaration site per type name.
Status:                Open
```

### TS-007

```
Issue:                 Root-level legacy `types.ts` (repo root, not src/) duplicates domain concepts that now have proper modern equivalents under src/features/*/types, and is still actively imported by 37+ files under src/
Location:              types.ts:53 (User), types.ts:142 (Course), types.ts:160 (Book), types.ts:260 (Booking), types.ts:177 (BookingSlot), types.ts:33 (UserConsultation), types.ts:47 (CourseInstallment) — vs. modern equivalents src/features/courses/types/api.types.ts (CourseDetail, CourseListItem, MyCourseDetail...), src/features/books/types/api.types.ts (BookDetail, BookListItem...), src/features/auth/services/auth-api.service.ts:52 (BackendAuthResult wrapping the same User)
Severity:              P1
Why it matters:        This is not dead legacy code that can be ignored — it is a currently-load-bearing type file for two competing modeling systems: the original mock-data-era domain model (`types.ts`, imported by things like `src/features/auth/services/auth-api.service.ts:2-3`) and the newer API-mapped-per-feature model (`src/features/*/types/api.types.ts`). New code has to decide which `User`/`Course`/`Book` to reach for, and both compile cleanly because nothing forces convergence.
Current behavior:      `src/features/auth/services/auth-api.service.ts` imports `UserRole` and `User` straight from the repo-root `../../../../types` and maps the real backend response (`BackendUser`) into that legacy `User` shape — meaning the "real" API-backed auth flow still produces the legacy demo-era type.
Recommended solution:  Per the baseline facts, root legacy files are already a known migration target. Prioritize `types.ts` specifically (over the Context files) since it's the one still structurally load-bearing for `src/`; migrate its consumers onto feature-owned types incrementally, feature by feature, rather than one big rename.
Risk:                  Medium — 37+ import sites; do this after TS-005/TS-006 (same class of problem, smaller surface) to build the pattern first.
Verification method:   Track the import count down: `grep -rl "from '.*[^/]/types'" src | wc -l` trending to 0.
Status:                Open
```

### TS-008

```
Issue:                 readLocalStorageJson<T>() is JSON.parse(raw) as T — a blind cast with no schema validation, used across every *-storage.service.ts
Location:              src/lib/storage/safe-local-storage.ts:43-51 (`return JSON.parse(raw) as T;`)
Severity:              P1
Why it matters:        This is the read path for every persisted domain record in the app (payments, care records, newsletter subscriptions, monograph favorites, community chat, etc. — anywhere a `*-storage.service.ts` exists). Like apiFetch (TS-002), it's a single chokepoint where a type-system promise (`T`) is made with zero runtime backing. Unlike apiFetch, the data source here is the user's own browser storage, which is even more likely to contain stale/older-schema data after an app update.
Current behavior:      `export function readLocalStorageJson<T>(key: string, fallback: T): T { ... return JSON.parse(raw) as T; ... }`
Recommended solution:  Same remedy family as TS-002/TS-004: accept an optional zod schema (or validator function) parameter, `safeParse` and fall back to `fallback` on mismatch instead of trusting the cast unconditionally. Lower priority than TS-002/TS-004 because this is same-origin local data, not attacker/backend-controlled, but it's still the direct cause of TS-004.
Risk:                  Low.
Verification method:   Unit test: write malformed JSON under a known key, call readLocalStorageJson with a schema, assert the fallback is returned instead of a shape mismatch propagating.
Status:                Open
```

### TS-009

```
Issue:                 Mutation/POST endpoints skip the defensive field-mapping that GET endpoints use, and blind-cast the strongly-typed result
Location:              src/features/courses/services/courses-api.service.ts:252 (`apiFetch<CourseCheckoutTransaction>(...)`), :287 (`apiFetch<CourseQuizResultItem>(...)`); same pattern in books/clinic/trips mutation calls
Severity:              P1
Why it matters:        Every GET in these same files goes through a mapper (`mapCourse`, `mapCourseDetail`, etc.) that defensively coerces every field (`numberValue()`, `text()`, `Boolean()`, `?? null`) — real, if manual, runtime safety. Mutation responses (checkout, quiz submit) skip that entirely: `apiFetch<CourseCheckoutTransaction>(...)` returns whatever the backend sent, cast straight to the transaction type, no coercion. These are the highest-stakes responses in the app (payment/checkout confirmations) and have the least defensive handling.
Current behavior:      `return apiFetch<CourseCheckoutTransaction>(...)` with no post-processing, contrasted with `mapCourse(item: ApiObject): CourseListItem` used on every read path in the same file.
Recommended solution:  Either add a mapper function for these transaction/result types symmetrical to the read-path mappers, or (better, longer-term) apply TS-002's zod-schema fix here first, since checkout is the highest-value place to catch a shape mismatch before it reaches payment UI.
Risk:                  Medium — checkout is a live money-handling flow; validate against captured real responses before changing behavior.
Verification method:   Confirm a schema/mapper exists for every apiFetch<T> call under checkout/payment/subscription mutation paths; `grep -n "apiFetch<" src/features/*/services/*-api.service.ts` to enumerate all call sites for a follow-up pass.
Status:                Open
```

### TS-010

```
Issue:                 Non-null assertion masks a real type hole under --strict (updateStoredConsultation(...)! collapses to a type that has no .id)
Location:              src/features/care/services/care-records-storage.service.ts:211-218
Severity:              P1
Why it matters:        `const withPortal = updateStoredConsultation(sessionConsultation.id, {...})!;` then `withPortal.id` is used at line 218. Under `--strict`, TypeScript reports `Property 'id' does not exist on type 'never'` (TS2339) — the `!` isn't just silencing a nullable warning, it's hiding a genuine type-inference collapse in `updateStoredConsultation`'s return type. The `!` currently keeps this compiling under strict:false; enabling strict without fixing the underlying signature will hard-fail the build here.
Current behavior:      `export function updateStoredConsultation(id: string, patch: Partial<StoredConsultationRecord>) { ... }` — return type is inferred, not declared, and evidently resolves to something incompatible with a non-null assertion + property access once strict inference is on.
Recommended solution:  Give `updateStoredConsultation` an explicit `StoredConsultationRecord | undefined` return type, and change the call site to check-and-return-early instead of asserting with `!` (same pattern already used two lines earlier at line 313-317 with `if (!record) { ...; return; }`).
Risk:                  Low — the codebase already has the "check, don't assert" pattern in the same file; this is bringing one call site in line with it.
Verification method:   `npx tsc --noEmit --strict` on this file only, confirm TS2339 at this location clears.
Status:                Open
```

### TS-011

```
Issue:                 checkout-page.tsx accesses `user` 11 times without narrowing a nullable auth value
Location:              src/features/checkout/components/checkout-page.tsx:329,341,352,361,377,392,393,394,425,478,493
Severity:              P1
Why it matters:        This is the single largest cluster of `--strict` errors (11 of 24) and it's on the checkout flow — `user.id`, `user.email` etc. are read repeatedly assuming the value is non-null, but the auth hook's type is nullable (`User | null`). Today this "works" only because `strictNullChecks` is off; if authentication state can legitimately be null at any of these call sites (e.g. a race on hydration, or an expired session mid-checkout), this is a live null-dereference risk, not just a lint nit.
Current behavior:      Repeated direct property access (`user.id`, `user.email`, etc.) inside a large component body with no single narrowing guard covering all 11 sites.
Recommended solution:  Add one early guard (`if (!user) return null; // or redirect to auth`) at the top of the branch/handler that owns these accesses, so TypeScript narrows `user` to non-null for the rest of the scope — mirrors the existing guard-early pattern used elsewhere in the same file (e.g. the `if (!record) {...; return;}` block).
Risk:                  Low — this is a well-understood React guard-clause refactor; verify the guard's UX (what happens when unauthenticated at checkout) matches product intent before merging.
Verification method:   `npx tsc --noEmit --strictNullChecks` on this file, confirm all 11 TS18047s clear with a single added guard.
Status:                Open
```

### TS-012

```
Issue:                 Navigation items model an optional `items` field instead of a discriminated union, so a manual `'items' in item` check doesn't narrow away `undefined`
Location:              src/features/navigation/components/site-layout.tsx:77, :125
Severity:              P2
Why it matters:        `'items' in item` proves the key exists on the object but not that its value is non-undefined for an optional property, so `item.items.map(...)` still errors under strict (TS18048). This is a textbook case for a discriminated union (`{ kind: 'link'; href; label } | { kind: 'group'; href; label; items: SubItem[] }`) instead of one type with an optional field plus an `in` check.
Current behavior:      `{'items' in item && (<div>{item.items.map((sub) => ...)}</div>)}` — two occurrences, same file.
Recommended solution:  Model the nav config as a discriminated union with a literal `kind`/`type` tag, switch the `in` check to a tag check (`item.kind === 'group'`), which narrows fully including the field's non-undefined-ness.
Risk:                  Low — small, localized type change plus updating the nav data source to include the tag.
Verification method:   `npx tsc --noEmit --strict` on this file, confirm both TS18048s clear.
Status:                Open
```

### TS-013

```
Issue:                 Tests fake react-query hook state via `as unknown as UseQueryResult<...>`, which strict flags as "may be a mistake"
Location:              src/features/courses/ui/course-flows.test.tsx:174,175,188 (6 as-unknown-as sites total in this file); src/features/community/components/community-chat.test.tsx:48,52; src/features/books/ui/BookCard.test.tsx (1)
Severity:              P2
Why it matters:        `as unknown as T` is the "I know better than the compiler" escape hatch — appropriate for tests mocking a complex generic like `UseQueryResult`, but every one of these is also a live `--strict` error (TS2352, 5 of the 6 non-null strict errors are here) because the mock object's shape doesn't structurally overlap enough with the real `UseQueryResult<T, Error>` (missing fields like `status`, `fetchStatus`, etc. that react-query's type requires). If the real hook's consumed shape changes, these tests won't catch it — they already bypass the type checker.
Current behavior:      e.g. `{ data: never[]; isLoading: false; } as unknown as UseQueryResult<...>` — a partial mock cast through `unknown`.
Recommended solution:  Use the testing library's own query-client test utilities (`@tanstack/react-query`'s `QueryClientProvider` + a real (mocked-fetch) query) instead of hand-built partial objects, or use a typed mock factory that fills every required field so the cast isn't needed.
Risk:                  Low — test-only code, no production risk, but it's a coverage/confidence gap worth flagging (these tests can't fail the way the real hook would).
Verification method:   `npx tsc --noEmit --strict` on affected test files, confirm TS2352 clears without an `as unknown as`.
Status:                Open
```

### TS-014

```
Issue:                 LanguageContext.tsx (72KB, 433+ language-entry legacy translation file) indexes a large union of per-language objects with a `Language` key, producing an implicit-any index access
Location:              LanguageContext.tsx:563
Severity:              P2
Why it matters:        This is the one strict error in repo-root legacy code (vs. 22 in src/features). It's a large, generated-feeling translation object where TypeScript can't prove every member of the giant union has a compatible index signature for the `Language` key type, so indexing resolves to implicit `any` (TS7053).
Current behavior:      A `Record`-like structure built from 400+ literal `{ en, ar, fr, es }` objects, indexed dynamically by a `Language` union type.
Recommended solution:  Not worth restructuring by hand given the file's size — either add an explicit index signature to the shared per-entry type so all 433 entries satisfy one interface, or (better, longer term) this file is already flagged as a legacy migration target per baseline facts; when it's replaced with a real i18n library (next-intl, etc.) this class of error disappears entirely.
Risk:                  Low — single error, isolated, no functional bug (it's a type hole, not a broken lookup).
Verification method:   `npx tsc --noEmit --strict LanguageContext.tsx` (or full run), confirm TS7053 count.
Status:                Open
```

### TS-015

```
Issue:                 `type ApiObject = Record<string, any>` repeated verbatim in 6 *-api.service.ts files as the untyped boundary for all backend payloads
Location:              src/features/courses/services/courses-api.service.ts:24, src/features/trips/services/trips-api.service.ts:24, src/features/consultations/services/care-portal-api.service.ts, src/features/clinic/services/clinic-booking-api.service.ts, src/features/clinic/services/clinics-api.service.ts, src/features/community/services/group-chat-api.service.ts
Severity:              P2
Why it matters:        This is the mechanism that makes TS-002/TS-009 possible in the first place: every field access inside a mapper (`item.is_locked`, `item.enrollment_status`, etc.) is on an `any`-typed value, so a typo in a snake_case field name (`item.is_lockedd`) is not a compile error — it silently returns `undefined` at runtime. The manual mapping is good defensive practice for values, but the input type itself opts out of the compiler's help catching the mapping code's own mistakes.
Current behavior:      `type ApiObject = Record<string, any>;` then dozens of `item.snake_case_field` accesses per file, none checked.
Recommended solution:  This is the natural landing spot for zod: replacing `ApiObject` with a zod-inferred type per endpoint response gets both runtime validation (TS-002) and compile-time field-name checking (this finding) in one change — schema definition and mapper input type become the same artifact.
Risk:                  Low as a follow-on to TS-002 (same schemas serve both purposes); higher if attempted as a standalone typing-only exercise (would require guessing at real backend shapes without validation).
Verification method:   `grep -rn "Record<string, any>" src/features/*/services/*-api.service.ts` trending to 0 as schemas land.
Status:                Open
```

### TS-016

```
Issue:                 The one real zod usage in the codebase (react-hook-form resolver) already requires a type-escape cast to compile
Location:              src/lib/forms/use-app-form.ts:11 — `resolver: zodResolver(schema) as UseFormProps<TFieldValues>['resolver']`
Severity:              P3
Why it matters:        Minor, but worth tracking: this is a TS2769 "no overload matches" under --strict, meaning zod 4.4's resolver type and react-hook-form's `UseFormProps['resolver']` type don't line up cleanly for a generic `ZodType<TFieldValues>` without a cast. Anyone building the TS-002/TS-003/TS-015 zod-at-the-boundary work should expect similar friction and budget for it, not treat it as a sign something is wrong with their schema.
Current behavior:      Single `as` cast, isolated to this one utility function; everything that calls `useAppForm` is unaffected.
Recommended solution:  Track upstream (`@hookform/resolvers` + zod 4.x compatibility) or pin to a resolver/zod combination without the mismatch; low urgency since it's contained to one line.
Risk:                  None currently (already working, just cast-through).
Verification method:   `npx tsc --noEmit --strict src/lib/forms/use-app-form.ts`, confirm whether a future dependency bump clears TS2769 without the cast.
Status:                Open
```

---

## Clean areas (no padding — stated once)

- No `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` anywhere in the repo (`src/` or legacy root) — zero suppression-comment debt.
- `--strictFunctionTypes`, `--strictBindCallApply`, `--noImplicitThis`, `--useUnknownInCatchVariables`, `--alwaysStrict` each produce **0** errors in isolation — safe to enable immediately, no migration cost.
- Explicit `: any` and `<any>` type annotations are almost entirely absent (1 and 0 occurrences in `src/`, respectively) — the `any` problem in this codebase is concentrated in `any[]` (1 file, 12 sites) and `Record<string, any>` (6 files, by design as the API boundary type), not scattered explicit annotations.
- The GET-path mapper functions in `*-api.service.ts` files (`mapCourse`, `mapTripPackage`, `mapCareBooking`, etc.) are consistently defensive — `numberValue()`, `text()`, `Boolean()` coercions and `?? null` fallbacks on every field — genuinely good runtime practice even without zod; the gap is narrower than "no validation exists," it's "validation exists on reads but not on mutation responses or storage."

---

## Recommended staged migration order

1. **Enable the 5 zero-cost flags together now**: `strictFunctionTypes`, `strictBindCallApply`, `noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`. Measured cost: 0 errors combined. This is a same-day, zero-risk PR.
2. **Exclude repo-root legacy files from the strict surface before going further** — not because they're numerically expensive (only 1 of 24 strict errors lives there), but because `tsconfig.json`'s `include` currently type-checks `LanguageContext.tsx` and friends under the same ruleset as `src/`, and TS-007 shows `types.ts` specifically is still load-bearing for `src/` imports so it can't simply be excluded wholesale — split it out: exclude the pure-legacy files (`BlogContext.tsx`, `CourseCommentContext.tsx`, `CurrencyContext.tsx`, `ResearchContext.tsx`, `TheoryContext.tsx`, `data.ts`, `components/*.tsx`, `services/geminiService.ts`, `LanguageContext.tsx`) from the strict-checked surface via a second tsconfig (or `// @ts-strict-ignore`-style per-directory config) while leaving `types.ts` in scope since `src/` depends on it directly.
3. **Enable `strictNullChecks` next** (26 solo errors, but the highest real-bug-density flag — TS18047/TS18048 are literal null/undefined dereferences on `user` in checkout and `item.items` in navigation). Fix TS-010, TS-011, TS-012 as part of this stage.
4. **Enable `noImplicitAny`** (12 errors) — mostly resolved by finishing TS-004 (typing the `any[]` storage reads) and cleaning up the remaining single-site `any`/`as any` occurrences.
5. **Flip `strict: true`** — by this point the remaining delta to full strict should be near zero, confirmed by rerunning `npx tsc --noEmit --strict`.
6. **Do not treat step 5 as "done."** The `--strict` error count never captures TS-002/TS-004/TS-008/TS-009/TS-015 — the `Record<string, any>` / blind-cast / zod-not-at-the-boundary issues — because those are structurally invisible to the type checker by design (that's what `any` does). Track those as a separate zod-adoption workstream with its own completion criteria (schema coverage per endpoint), independent of the tsconfig strict flags.

**First flag to enable: the 5 zero-cost flags as one batch, immediately.** For the highest-value *single* flag after that, enable `strictNullChecks` before `noImplicitAny` — it has both the larger error count and, per TS-011, the more concretely dangerous failure mode (null access on an authenticated user object mid-checkout) of the two.
