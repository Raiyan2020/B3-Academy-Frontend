# Final Frontend-Business Alignment Audit

**Project:** B3 Academy Next.js frontend  
**Audit date:** 2026-06-22  
**Business source:** `B3 Academy new.docx`  
**Previous analyses reviewed:** `UI_BUSINESS_GAP_PLAN.md`, `UI_BUSINESS_MISSING_GAPS_PLAN.md`  
**Build verification:** `npm run build` passed (Next.js 16.2.9; 62 page routes and one existing route handler).

## 1. Executive summary

This repository has a substantial customer-facing implementation, but it is not yet aligned with the full business document. The public site, account center, catalogs, checkout shell, community, learning, care, and subscription surfaces exist. The highest-risk customer defects are not missing page shells; they are broken lifecycle continuity: selected care slots are discarded during checkout, completed initial consultations are written to one store while eligibility checks read another, consultation detail/portal pages read records that the current checkout does not populate, book-format ownership is inconsistent, and the AI assistant uses a generative model although the business requires keyword-only predefined replies.

The other major scope finding is that the previous plans excluded everything after section `2.1`. That is not the exclusion requested for this audit. Only use case `2.1` is excluded. Sections `2.2` through `2.10.4.3` describe required admin frontend surfaces and are therefore in scope. No admin route group, admin navigation, management tables, or admin forms currently exists.

### Status totals

| Classification | Count |
|---|---:|
| Fully Implemented ✅ | 14 |
| Partially Implemented ⚠️ | 39 |
| Incorrectly Implemented ❌ | 9 |
| Missing ❌ | 66 |
| Excluded — Dashboard Scope | 1 |
| **Total numbered business use cases** | **129** |

### Actionable gap totals

| Priority | Gap count |
|---|---:|
| Critical | 13 |
| High | 19 |
| Medium | 6 |
| Low | 0 |
| **Total consolidated gaps** | **38** |

### Direct answers

1. **Missing features:** the complete admin application from `2.2` onward, plus several customer-side states and management actions.
2. **Incorrect features:** care slot/initial-consultation continuity, consultation portals, book-format ownership, encyclopedia controls, and the AI response model.
3. **Screens to build:** admin users, courses, books, encyclopedia, clinics/schedules/bookings, consultations/doctor portal, trips, community moderation/content, health assessments, subscriptions, newsletter, and AI configuration.
4. **Workflows to fix first:** authentication return intents, selected-slot preservation, initial-consultation completion, consultation record ownership, course completion rules, and book format-specific access.
5. **Missing UI elements:** functional encyclopedia filters/search/favorites, course duration/currency filters, package session scheduling, care lifecycle states, admin CRUD forms/tables/filters/dialogs, and real social/contact links.
6. **Implementation order:** lifecycle correctness first, customer core flows second, admin operational surfaces third, then consistency and polish.

## 2. Scope and decision rules

- This is a frontend-only audit. Mock data, local state, and `localStorage` are accepted as placeholder persistence.
- No gap asks for Laravel, databases, API endpoints, authentication infrastructure, payment gateways, notification infrastructure, or production services.
- Frontend service contracts, mock adapters, state transitions, loading/error/empty states, validation, and UI behavior remain in scope.
- Commented, unreachable, inert, or placeholder controls do not count as implemented.
- The numbered use case is the traceability unit. Every normative clause and side scenario under that use case was considered when assigning its primary status.
- `2.1 الصفحة الرئيسية للوحة التحكم` alone is excluded. Later level-one sections (`2.2` onward) are not descendants of `2.1` and are not excluded.

## 3. Audit methodology

1. Extracted all 129 numbered use cases from the DOCX in document order.
2. Inventoried all 62 `src/app/**/page.tsx` routes, 130 feature files, shared components, contexts, mock services, and storage adapters.
3. Inspected route reachability through `src/features/navigation/components/site-layout.tsx` and `src/features/account/components/account-shell.tsx`.
4. Verified customer workflows in code, including auth gates, checkout, ownership, learning progress, booking records, subscription state, newsletter state, favorites, and notifications.
5. Confirmed that no admin route group or admin feature module exists.
6. Re-ran the production build. It passed TypeScript and static generation.
7. Reconciled both previous gap documents against the current source rather than copying their conclusions.

## 4. Current frontend inventory

### Public/customer route surface

- Shell and public information: `/`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/search`, `/ratings`.
- Education: `/education`, `/courses`, `/courses/[courseId]`, `/learn/[courseId]`, `/books`, `/books/[bookId]`, `/read/[bookId]`, `/encyclopedia`, `/encyclopedia/[entryId]`.
- Care: `/clinic`, `/clinic/[clinicId]`, `/clinic/[clinicId]/book`, `/consultations`, `/consultations/[doctorId]/book`, `/consultation/[consultationId]`, `/consultation/[consultationId]/chat`, `/trips`, `/trips/[tripId]`, `/trips/[tripId]/initial-consultation`.
- Community: `/community`, blogs, theories, researches, chat, podcasts, cooperation, and subscriber monographs.
- Commerce/access: `/auth`, `/checkout/[type]/[id]/[[...format]]`, `/subscriptions`, `/health-assessment`, `/rate-us`.
- Account: `/dashboard` and 14 subsection routes for profile, password, courses, books, clinic bookings, consultations, trips, subscription, payments, health assessments, favorites, notifications, newsletter, and security.

### Existing strengths

- The App Router route surface is broad and the production build passes.
- Header account/auth switching and grouped education/care navigation are implemented (`site-layout.tsx:31-143`).
- Checkout has a frontend review, success, failure, and retry lifecycle (`checkout-page.tsx:131-172`, `310-369`).
- Learning has typed enrollment, progress, attempt, and certificate placeholder services.
- The account center has useful empty states and local records instead of relying only on static demo cards.
- Active subscription plans, manual renewal messaging, and active-plan purchase blocking are present.
- Health assessment submission correctly avoids showing a diagnosis, score, result, or recommendation.

### Structural risks

- There is no admin route or feature surface despite 66 wholly missing admin use cases.
- Several feature components still rely on root contexts or duplicate inline mock collections.
- Customer records are split between `User` fields and feature storage services; some consumers read the wrong source.
- Several visible controls are inert, including footer social links, encyclopedia controls, and some share actions.
- Some business metadata is fabricated by `.slice()` or hard-coded fallback rules instead of respecting `isActive`, `isFeatured`, format, currency, slot, or access metadata.

## 5. Requirement-by-requirement audit summary

The complete 129-row classification is in the coverage matrix. The following is the implementation interpretation by business area.

### 5.1 Public shell, visitor, authentication, and search

- The header is fully represented. The home, footer, visitor model, and auth surface are partial because curated content rules, real contact/social targets, optional/required field behavior, and pending-action return behavior are inconsistent.
- Global search is partial: it indexes courses, books, encyclopedia entries, and community section landing cards, but omits articles, researches, consultations, clinics, trips, FAQ entries, podcasts, and other approved content (`search-index.service.ts:7-44`).
- `RequireAuth` redirects to `/` before the auth action is completed (`require-auth.tsx:12-20`), producing a different experience from action-level gates and losing context on several journeys.

### 5.2 Education, courses, and books

- Course and book shells exist, but catalog metadata and filters do not fully follow the document. Course featured fallback invents items when no feature flag exists (`course-catalog.tsx:32-36`); price filtering uses base numeric prices rather than the selected converted currency (`course-catalog.tsx:48-50`); duration filters are declared but not rendered.
- Course detail has locked curriculum headings and state-aware CTAs, but installment availability is copy rather than data-driven presentation (`course-detail-page.tsx:40-64`).
- Course learning is functional but incomplete: module quizzes can be opened before module lessons are complete, attempt records omit submitted answers, lesson completion uses a 30-second generic gate, and certificate eligibility omits module-quiz completion when no final exam exists (`course-player.tsx:39-49`, `223-274`; `quiz-attempt.service.ts:5-40`).
- Book purchase records are format-specific, but general `purchasedBookIds` still treats every purchase as ebook ownership in some screens. Book detail derives `owned` from the aggregate ID and disables ebook/bundle after a physical-only purchase (`book-detail-page.tsx:26-31`), while the reader correctly uses `hasEbookAccess()` (`book-reader.tsx:86-94`).
- The ebook reader uses one hard-coded five-page content set for every book and cannot technically guarantee screenshot prevention in a browser. The product must define a feasible deterrence/failure message rather than promise absolute prevention.
- Encyclopedia search and four filter controls are visual only, editor picks are arbitrary slices, and detail favorite/share controls are not wired (`encyclopedia-list.tsx:11-17`, `119-132`; `encyclopedia-detail.tsx:151`).

### 5.3 Care, consultations, and trips

- Clinic, consultation, and trip catalogs are present and generally navigable.
- A selected slot is passed into checkout as `slotId`, but successful record creation ignores it and writes hard-coded future dates/times (`checkout-page.tsx:24`, `211-223`, `243-258`). This makes clinic and individual consultation booking incorrect.
- Initial consultation purchases are written through `addStoredConsultation`, while clinic/trip eligibility checks read `user.consultations` (`clinic-detail-page.tsx:25-33`; `trip-detail-page.tsx:25-38`). There is no completion action that reconciles those stores, so the implemented prerequisite journey cannot unlock the dependent purchase.
- Consultation detail and chat read `user.consultations` (`consultation-detail.tsx:26`; `chat-consultation.tsx:28`) while current checkout creates feature-storage records. The generated portal URL also uses a synthetic ID that is not the stored consultation record ID (`checkout-page.tsx:243-258`).
- Consultation packages can be bought and show remaining sessions in records, but customers cannot schedule package sessions or prevent overbooking.
- Trip purchase preserves the prerequisite and duplicate intent, but does not re-check seat availability before final confirmation.

### 5.4 Community, subscriptions, newsletter, and AI

- The community landing page and cooperation request form are strong frontend implementations.
- Articles, theories, and researches use shared local collections without `isActive`/access-level metadata, so direct subscriber-only access and consistent like/comment gating are not enforceable.
- Subscriber chat has text messaging and read-only expiry behavior, but lacks subscription-start history boundaries and moderation/closed states.
- Podcast playback persists across navigation but not page refresh, and episode-level public/subscriber visibility is absent.
- Monograph list data is duplicated inline rather than using the monograph service; language and business-field consistency remain uneven.
- Newsletter behavior is split: the footer/account use the newsletter service, while the home popup only sets component state (`home-page.tsx:19-45`).
- The AI assistant is materially wrong: the business requires admin-authored keywords and random predefined text replies, but the current client sends conversation history to a generative Gemini route (`AIChatWidget.tsx:46-73`; `src/app/api/ai/chat/route.ts:34-47`). The remedy in this roadmap is frontend behavior and mock-contract work only—not backend/API implementation.

### 5.5 Account center

- The account shell and most sections exist. Payments, notifications, subscriptions, health assessments, purchased books, and newsletter management are the closest to complete.
- Profile editing lacks avatar management and confirms email without an entered OTP (`profile-page.tsx:20-25`, `62-66`).
- Password change does not update or verify a stored mock credential (`auth-provider.tsx:127-130`).
- Course certificates inherit the course eligibility bug, and there is no next-installment action from the account.
- Clinic/consultation detail pages do not resolve feature-storage records created by checkout.
- Favorites are implemented for only some eligible content types.
- Delete account clears/anonymizes local records but the same email can immediately create a fresh mock session; the frontend placeholder lacks deleted/blocked account state.

### 5.6 Admin frontend (`2.2` onward)

No `/admin` routes, admin shell, admin navigation, admin feature modules, management tables, editor forms, moderation queues, schedule builders, exports, or doctor portal exist. The mock auth provider can assign `UserRole.ADMIN` for `admin@b3.com` (`auth-provider.tsx:35-41`), but that role has no usable admin interface. All admin requirements are therefore missing except:

- `2.10.2.3`, partially represented by customer-side subscription rules.
- `2.10.4.3`, incorrectly represented by the generative AI assistant.

## 6. Consolidated actionable gaps

### GAP-001 — Standardize auth-gated actions and return intents

**Business requirement:** `1.1`, `1.5`, and all service actions require browsing to remain public and the interrupted action to resume after sign-in.  
**Current frontend state:** course/book/subscription use typed pending intents; clinic, consultation, trip, favorite, newsletter, and protected-route redirects do not consistently do so.  
**Gap analysis:** `RequireAuth` redirects home and action handlers often call `requireAuthAction()` without storing enough context.  
**Required frontend changes:** route all service CTAs through one gate; persist item, format, slot, currency, payment mode, source URL, and return URL; render cancel/continue choices; clear only after successful resume.  
**Affected areas:** `src/features/access/**`, `src/features/auth/**`, care/trip/community/account CTAs.  
**Acceptance criteria:** every guest action resumes at the exact item and step; cancelling returns to the same browse page; no protected route flashes or silently redirects home.  
**Priority / complexity:** **High / Large**.

### GAP-002 — Make home content business-configured and internally consistent

**Business requirement:** `1.2` requires approved featured courses/books, healing stories, subscriptions, FAQ, and no invented fallback content.  
**Current frontend state:** required sections exist, but featured services slice mock arrays, testimonials are repeated hard-coded cards, and home subscription CTAs route to registration rather than the plan/checkout path.  
**Required frontend changes:** add explicit `isFeatured`, `isActive`, display-order, testimonial approval, and empty states to mock contracts; use the same plan service and pending intent as `/subscriptions`; remove unrelated newsletter-popup success logic from the home requirement path or connect it to GAP-024.  
**Affected areas:** `home-page.tsx`, course/book/review/subscription services.  
**Acceptance criteria:** no fallback item appears without a feature flag; home CTAs enter the correct business journey; zero-state sections do not fabricate content.  
**Priority / complexity:** **High / Medium**.

### GAP-003 — Complete footer contact and external-link behavior

**Business requirement:** `1.4` requires phone, email, optional address, official social channels, legal links, navigation, and validated newsletter entry.  
**Current frontend state:** navigation, legal links, email, and form exist; phone/address are absent and every social link is `href="#"` (`site-layout.tsx:210-223`).  
**Required frontend changes:** add typed frontend contact configuration, render only available fields, provide actual `tel:`, `mailto:`, map, and social targets, and add explicit invalid/pending/success messages.  
**Affected areas:** `site-layout.tsx`, site-content configuration.  
**Acceptance criteria:** every displayed link performs its stated action; absent contact fields are hidden; email validation is visible.  
**Priority / complexity:** **Medium / Small**.

### GAP-004 — Finish authentication form rules and mock lifecycle states

**Business requirement:** `1.6`, `1.15.1`, `1.15.2`, `1.15.14`.  
**Current frontend state:** login/register, terms, OTP modal, reset flow, profile, password, logout, and delete UI exist. Phone is optional, demo OTP is exposed, password reset accepts any code length, email confirmation needs no entered OTP, and credentials are not actually changed in the mock adapter.  
**Required frontend changes:** codify required fields and password rules; add resend/countdown/invalid/expired states; require an entered mock OTP; add duplicate/deleted/blocked mock-account states; persist mock credential changes through an auth adapter.  
**Affected areas:** `auth-page.tsx`, `auth-provider.tsx`, profile/password/security pages.  
**Acceptance criteria:** all required fields validate inline; wrong/expired OTP and credentials have distinct states; password/profile/delete actions materially update the placeholder state.  
**Priority / complexity:** **High / Large**.

### GAP-005 — Expand global search coverage

**Business requirement:** `1.7` requires text search across courses, books, encyclopedia, articles, researches, consultations, clinics, trips, FAQ, and other approved content, grouped by type.  
**Current frontend state:** only courses, books, encyclopedia entries, and community section cards are indexed.  
**Required frontend changes:** add frontend search adapters for content items and care services; apply active/access metadata; preserve grouped results and direct detail links; add invalid-query and unavailable-result handling.  
**Affected areas:** `search-index.service.ts`, domain services, `search-page.tsx`.  
**Acceptance criteria:** every named business content type can produce a direct result; inactive items never appear; locked items remain discoverable with the proper badge.  
**Priority / complexity:** **High / Medium**.

### GAP-006 — Correct course catalog metadata, filters, and featuring

**Business requirement:** `1.8`, `1.8.1`.  
**Current frontend state:** catalog, category tabs, search, level, price, sort, cards, and ownership badge exist. Active/featured fields are not authoritative, duration inputs are not rendered, and price filters do not use selected-currency numeric values.  
**Required frontend changes:** add active/featured/order/published/category metadata; remove fallback featuring; render duration range and currency selector; filter on converted numeric values; localize category/level labels.  
**Affected areas:** course types/data/service/catalog, `CurrencyContext.tsx`.  
**Acceptance criteria:** all documented filters combine correctly; changing currency changes display and filter results; no inactive or unfeatured fallback appears.  
**Priority / complexity:** **High / Medium**.

### GAP-007 — Complete course detail actions and payment-mode presentation

**Business requirement:** `1.8.2`.  
**Current frontend state:** detail, locked headings, similar courses, price, instructor name, and state-aware CTA exist; share is inert and installment availability is generic copy.  
**Required frontend changes:** render only configured payment modes and installment terms; wire share/copy feedback; ensure inactive direct links and no-similar states; make optional trailer presentation data-driven.  
**Affected areas:** course detail, course model, checkout intent.  
**Acceptance criteria:** payment choices exactly match course configuration; share works; no curriculum content opens for non-owners.  
**Priority / complexity:** **Medium / Medium**.

### GAP-008 — Make course checkout and installments internally complete

**Business requirement:** `1.8.3` requires full/installment choice, review, failure/cancel/retry, access according to paid sections, confirmation, and invoice.  
**Current frontend state:** review, failure simulation, invoice, enrollment, and first-installment entitlements exist; installment count is hard-coded to six, no later-installment checkout path exists, and cancel/source-return is absent.  
**Required frontend changes:** derive installment count, amounts, and section entitlements from the course; add pay-next-installment action and review; handle cancellation and return; show all frontend lifecycle states.  
**Affected areas:** checkout, enrollment service/types, course detail/player/account courses.  
**Acceptance criteria:** full payment unlocks all configured sections; each installment unlocks only mapped sections; retry/cancel does not grant access; account can pay the next installment.  
**Priority / complexity:** **Critical / Large**.

### GAP-009 — Correct course progress, tests, and certificates

**Business requirement:** `1.8.4`–`1.8.6`.  
**Current frontend state:** deterministic lesson progress, resume point, quiz attempts, final-exam lock, installment lock, and certificate record exist.  
**Gap analysis:** module quizzes are not locked by module completion; attempts omit answers; pass/retake history is incomplete; the 30-second lesson rule is generic; certificate eligibility can ignore module quizzes.  
**Required frontend changes:** create explicit lesson completion rules by content type; gate each module test; save answers/score/pass/time/attempt number; apply configured retake rules; require every configured completion condition; generate one consistent certificate artifact and status.  
**Affected areas:** learning player, quiz player/services/types, certificate service, account courses.  
**Acceptance criteria:** no test or certificate unlocks early; failed attempts do not count as completion; progress and certificate status agree across player/account reloads.  
**Priority / complexity:** **Critical / Large**.

### GAP-010 — Correct book catalog/detail format ownership

**Business requirement:** `1.8.7`, `1.8.8`.  
**Current frontend state:** catalogs, details, formats, related books, ownership and checkout links exist, but detail ownership uses aggregate `purchasedBookIds`.  
**Required frontend changes:** derive ebook, physical, and bundle ownership only from `BookPurchase`; model format availability explicitly; add required catalog currency/price/format/category filters and active/featured rules; remove aggregate ownership as an authorization signal.  
**Affected areas:** book catalog/detail/services/types, auth user purchase fields.  
**Acceptance criteria:** physical-only ownership never unlocks or disables ebook; each format can be bought once when available; cards/filters use selected currency and active metadata.  
**Priority / complexity:** **Critical / Large**.

### GAP-011 — Complete book checkout address and duplicate rules

**Business requirement:** `1.8.9`.  
**Current frontend state:** format-aware review, saved-address selection, failure/retry, invoice, and purchase record exist. New-address creation is not available in checkout and duplicate rules are incomplete.  
**Required frontend changes:** add inline address create/select/default flow; preserve chosen format/currency/address through auth and retry; block duplicate format purchases while allowing a different format; show shipping handoff status.  
**Affected areas:** checkout, book purchase service, profile addresses, account books.  
**Acceptance criteria:** physical/bundle cannot pay without an address; ebook never requests one; format-specific duplicate scenarios match the business document.  
**Priority / complexity:** **High / Medium**.

### GAP-012 — Replace generic ebook content and define feasible protection UX

**Business requirement:** `1.8.10`.  
**Current frontend state:** format-specific ownership gate, in-platform reader, chapter navigation, progress, and no download control exist; all books share hard-coded chapters.  
**Required frontend changes:** load per-book reader content through a frontend content adapter; add print/context-menu/copy deterrence and watermark/notice behavior where desired; document that browser screenshots cannot be absolutely prevented.  
**Affected areas:** book reader, book content types/service.  
**Acceptance criteria:** each ebook renders its own content; physical-only owners are denied; no download/export UI exists; the protection message is accurate rather than promising an impossible guarantee.  
**Priority / complexity:** **Medium / Medium**.

### GAP-013 — Rebuild encyclopedia search, filters, editor picks, and actions

**Business requirement:** `1.8.11`, `1.8.12`.  
**Current frontend state:** page sections and detail views exist, but search state is unused, four filters are inert buttons, editor picks are array slices, and favorite/share are not functional.  
**Required frontend changes:** separate news/editor/herb item types; add active/editor/order metadata; implement name search and four combinable herb filters; wire share and account favorite gates; add no-result and unavailable states.  
**Affected areas:** encyclopedia list/detail/data/service, account favorites, global search.  
**Acceptance criteria:** each filter changes only the herb library; multiple filters intersect; editor picks are explicit; favorite/share work for guests and members as specified.  
**Priority / complexity:** **High / Large**.

### GAP-014 — Normalize care money and public detail behavior

**Business requirement:** `1.9.1`, `1.9.2`, `1.9.4`, `1.9.8`, `1.9.9`.  
**Current frontend state:** pages, cards, active lists, search/filters, details, favorites, and primary CTAs exist; prices are hard-coded with `$`, share controls are inert, and availability metadata is uneven.  
**Required frontend changes:** use shared money formatting/filtering; wire share; normalize active/category/order/availability fields; add loading/unavailable/no-result states consistently.  
**Affected areas:** clinic, consultations, trips, care data/types, currency context.  
**Acceptance criteria:** all care prices and filters use the selected currency; inactive direct links fail gracefully; share controls work.  
**Priority / complexity:** **Medium / Medium**.

### GAP-015 — Preserve and validate selected slots end to end

**Business requirement:** `1.9.3`, `1.9.5`.  
**Current frontend state:** slot selector passes `slotId` into checkout, but checkout creates hard-coded dates/times and never checks the selected slot again.  
**Required frontend changes:** carry slot ID/date/time/type/doctor through pending intent and payment review; display the selected appointment; re-check mock availability before success; show slot-lost recovery; write the exact slot to the record.  
**Affected areas:** booking slot service/selector, care routes, checkout, care records, account booking pages.  
**Acceptance criteria:** the account record exactly matches the chosen slot; an unavailable slot cannot complete; retry lets the customer choose another slot without losing context.  
**Priority / complexity:** **Critical / Large**.

### GAP-016 — Unify initial-consultation lifecycle and eligibility

**Business requirement:** `1.9.11`, `1.9.12`.  
**Current frontend state:** booking and checkout routes exist, but records are stored separately from the eligibility source and there is no completion transition.  
**Required frontend changes:** use one consultation repository for creation, account display, detail, completion, and prerequisite evaluation; distinguish clinic-doctor and general-trip initial consultations; prevent duplicate active bookings; add scheduled/active/completed/closed states.  
**Affected areas:** auth user model, care record service, clinic/trip details, consultation pages, checkout.  
**Acceptance criteria:** buying and completing the exact required initial consultation unlocks only its dependent clinic/trip; pending or unrelated consultations do not.  
**Priority / complexity:** **Critical / Large**.

### GAP-017 — Add consultation-package session scheduling

**Business requirement:** `1.9.6`, `1.15.6`.  
**Current frontend state:** package purchase and remaining-session fields exist; no customer action schedules a package session.  
**Required frontend changes:** add package detail in account, remaining/used counts, available-slot selection with the package doctor, confirmation, and overbooking prevention; show session history.  
**Affected areas:** consultation package records, account consultations, booking slot selector, consultation detail.  
**Acceptance criteria:** each confirmed session decrements one allowance; no session can be booked beyond the package balance; history and next session are visible.  
**Priority / complexity:** **High / Large**.

### GAP-018 — Reconnect consultation detail and execution portals

**Business requirement:** `1.9.7`, plus account consultation access.  
**Current frontend state:** detail/chat pages exist but read `user.consultations`; checkout writes feature records and generates a non-record portal ID. Chat is component-local, includes an inert attachment button, and has no close lifecycle.  
**Required frontend changes:** resolve stored records by stable ID; route video vs text correctly; enforce start/end windows; implement allowed attachment UI or remove it; persist placeholder messages; add closed/completed/missed states.  
**Affected areas:** consultation detail/chat, care records, checkout-generated links, account consultations.  
**Acceptance criteria:** every paid consultation opens its own detail and correct portal; unauthorized/wrong-format access is denied; closed sessions become read-only.  
**Priority / complexity:** **Critical / Large**.

### GAP-019 — Complete trip capacity and confirmation states

**Business requirement:** `1.9.10`.  
**Current frontend state:** prerequisite, duplicate check, checkout, invoice, purchased record, and coordination note exist. Capacity is not re-checked at confirmation and purchase does not decrement mock availability.  
**Required frontend changes:** add capacity reservation/re-check placeholder state, sold-out recovery, exact purchase confirmation, and consistent account status.  
**Affected areas:** trip detail/data, checkout, care records, account trips.  
**Acceptance criteria:** sold-out packages cannot complete; duplicate purchase remains blocked; success produces one purchase/payment/invoice/account record.  
**Priority / complexity:** **High / Medium**.

### GAP-020 — Apply community item access and interaction metadata

**Business requirement:** `1.10.3`–`1.10.5`.  
**Current frontend state:** article/theory/research list/detail and local likes/comments exist without active/access metadata.  
**Required frontend changes:** define item-level public/subscriber/inactive states; keep locked discovery visible; block direct detail content appropriately; gate like/comment by auth/subscription; add deleted/disabled comment states.  
**Affected areas:** community content service/types, root contexts, six list/detail components.  
**Acceptance criteria:** public and locked items behave consistently from list, search, and direct URL; interactions require the documented access; inactive content is unavailable.  
**Priority / complexity:** **High / Large**.

### GAP-021 — Finish subscriber chat lifecycle

**Business requirement:** `1.10.1`.  
**Current frontend state:** subscriber gate, text-only messages, admin seed distinction, storage, and expired read-only state exist.  
**Required frontend changes:** restrict visible history according to subscription start where required; add loading/closed/moderated message states; keep expired users read-only without allowing sends.  
**Affected areas:** community chat component/service, subscription history.  
**Acceptance criteria:** access/history is derived from the current subscription period; disabled/expired/closed states are explicit and non-destructive.  
**Priority / complexity:** **Medium / Medium**.

### GAP-022 — Complete podcast discovery and access behavior

**Business requirement:** `1.10.2`.  
**Current frontend state:** episode cards and global audio player exist; all episodes are hard-coded public and playback state is lost on refresh.  
**Required frontend changes:** add active/access/category/order metadata, public/subscriber badges and gates, search/category filtering if configured, and local resume position.  
**Affected areas:** podcast types/service/library/player.  
**Acceptance criteria:** locked/public episodes follow metadata; playback resumes after navigation and optional refresh; inactive episodes are absent.  
**Priority / complexity:** **Medium / Medium**.

### GAP-023 — Normalize plant/fungi encyclopedia data and allowed fields

**Business requirement:** `1.10.7`, `1.10.8`.  
**Current frontend state:** subscription gate, name search, type filter, cards, detail, and favorite exist; list defines a separate inline mock collection and mixed-language copy, creating schema drift.  
**Required frontend changes:** use one service/model; align exact list/detail fields, categories, active/order metadata, and search rules; remove disallowed field leakage and keep favorite behavior consistent.  
**Affected areas:** monograph list/detail/service/data/favorites.  
**Acceptance criteria:** list and detail resolve the same record; only approved fields appear; locked/direct/expired access is consistent.  
**Priority / complexity:** **High / Medium**.

### GAP-024 — Unify newsletter subscription UX

**Business requirement:** `1.13`, `1.15.13`.  
**Current frontend state:** footer/account use pending/confirmed/unsubscribed records; home popup reports success without creating a record.  
**Required frontend changes:** route every entry point through the same service and auth/pending-intent rule; add duplicate, pending-confirmation, confirmed, unsubscribed, and resubscribe states; show the same email throughout.  
**Affected areas:** home popup, footer, newsletter service, account newsletter.  
**Acceptance criteria:** every signup produces one consistent placeholder record; duplicate submissions are explained; account state matches footer/home immediately.  
**Priority / complexity:** **High / Medium**.

### GAP-025 — Replace generative assistant behavior with the required keyword model

**Business requirement:** `1.14`, `2.10.4.3`.  
**Current frontend state:** text widget sends history to Gemini and renders generated Markdown.  
**Required frontend changes:** define a frontend assistant contract with enabled flag, welcome text, fallback text, keyword groups, and multiple predefined answers; match keywords and choose a configured answer; keep text-only input/output; do not retain conversations or execute actions.  
**Affected areas:** AI widget/client/types; admin AI settings in GAP-038. No API/backend task is created.  
**Acceptance criteria:** unknown text returns the configured fallback; known text returns only a configured answer; no generated content, attachments, action execution, or conversation history exists.  
**Priority / complexity:** **Critical / Large**.

### GAP-026 — Finish account record consistency and self-service controls

**Business requirement:** `1.15.1`–`1.15.14`.  
**Current frontend state:** every subsection route exists, but profile/avatar, credential mutation, course eligibility, care detail resolution, favorite coverage, and deleted-account placeholder state remain incomplete.  
**Required frontend changes:** add avatar UI; complete mock credential/OTP rules; use feature repositories consistently; add next-installment and package-session actions; expand favorite integrations; derive unavailable favorite states; preserve one account event source.  
**Affected areas:** account shell/sections/services, auth provider, learning, care, library/community.  
**Acceptance criteria:** each purchase/booking/submission appears once in its account section and opens a working detail/action; account mutations survive reload; removed/unavailable content is represented safely.  
**Priority / complexity:** **High / Large**.

### GAP-027 — Build admin shell and user management

**Business requirement:** `2.2.1`–`2.2.4`.  
**Current frontend state:** an admin role can be mocked, but no admin route, shell, user list, add form, profile, or status controls exist.  
**Required frontend changes:** create an admin layout/navigation and user management feature with searchable/filterable list, add-user form, full customer activity tabs, edit form, and active/inactive/blocked confirmation flows using typed mock adapters.  
**Affected areas:** new `src/app/(admin)/admin/**`, `src/features/admin/users/**`, auth role routing.  
**Acceptance criteria:** an admin can reach all four screens, inspect all documented customer domains, create/edit placeholder records, and see status effects; non-admins receive an access state.  
**Priority / complexity:** **Critical / Large**.

### GAP-028 — Build admin course operations

**Business requirement:** `2.3.1`–`2.3.7`.  
**Current frontend state:** no admin course UI; customer data is static mock content.  
**Required frontend changes:** add course table/filter/status actions, base-data editor, section/lesson/material builder, quiz/final-exam editor, certificate settings, enrolled-student/progress view, and category/level management. Include all documented post-enrollment warnings and confirmation dialogs.  
**Affected areas:** new admin course routes/features; shared course/learning types and mock repository.  
**Acceptance criteria:** every configured customer-facing field and rule can be represented through the admin UI; destructive/post-enrollment changes show the required consequences before saving.  
**Priority / complexity:** **Critical / Large**.

### GAP-029 — Build admin book operations

**Business requirement:** `2.4.1`–`2.4.6`.  
**Current frontend state:** no book administration UI.  
**Required frontend changes:** add book list/status controls, add/edit form with per-format availability/pricing, categories, ebook-file UI metadata, purchases/printed-order table, and per-book buyer view.  
**Affected areas:** new admin book routes/features; shared book/purchase mock repository.  
**Acceptance criteria:** format availability and prices configured in admin drive customer cards/detail/checkout; purchase views distinguish ebook, print, and bundle states.  
**Priority / complexity:** **Critical / Large**.

### GAP-030 — Build admin education encyclopedia operations

**Business requirement:** `2.5.1`–`2.5.6`.  
**Current frontend state:** no admin UI; customer editor picks and filters are hard-coded/inert.  
**Required frontend changes:** add news list/editor, explicit editor-pick ordering, four filter-dimension/type managers, herb list, and herb editor matching customer detail fields.  
**Affected areas:** new admin encyclopedia routes/features; shared encyclopedia repository and GAP-013.  
**Acceptance criteria:** admin choices immediately drive customer active items, editor picks, search, and all four filter dimensions in the mock frontend.  
**Priority / complexity:** **High / Large**.

### GAP-031 — Build admin clinic, doctor, schedule, and booking operations

**Business requirement:** `2.6.1`–`2.6.8`.  
**Current frontend state:** no admin clinic/schedule/booking UI; customer slots are generic global mock slots.  
**Required frontend changes:** add clinic list/editor, clinic categories, general care services, unified doctor schedule builder, in-person rules, clinic initial-consultation settings, and booking table/detail/close actions.  
**Affected areas:** new admin clinic/schedule routes/features; care data/slot/record contracts; GAP-015/016.  
**Acceptance criteria:** doctor-specific schedules generate the customer slots; clinic and initial-consultation rules are configurable; confirmed bookings can be reviewed and closed.  
**Priority / complexity:** **Critical / Large**.

### GAP-032 — Build admin consultation and doctor portal operations

**Business requirement:** `2.7.1`–`2.7.6`.  
**Current frontend state:** no admin settings, booking management, package session management, or doctor portal exists.  
**Required frontend changes:** add doctor settings, individual type editor, package CRUD, booking close/manage views, package purchase/session schedule views, and one doctor portal separating in-person, video, and text sessions with documented actions.  
**Affected areas:** new admin/doctor routes/features; consultation repositories and GAP-017/018.  
**Acceptance criteria:** admin can configure and manage every consultation source; doctor sees only assigned records and can enter/close the correct session format.  
**Priority / complexity:** **Critical / Large**.

### GAP-033 — Build admin trip operations

**Business requirement:** `2.8.1`–`2.8.5`.  
**Current frontend state:** no trip management UI.  
**Required frontend changes:** add package list/editor/status, category management, maximum-buyer warning/validation, purchase/export table, and general initial-consultation configuration.  
**Affected areas:** new admin trip routes/features; shared trip/capacity/consultation models.  
**Acceptance criteria:** active packages, categories, limits, and prerequisite settings drive customer UI; purchase records can be filtered and exported from the frontend placeholder.  
**Priority / complexity:** **High / Large**.

### GAP-034 — Build admin community content and moderation operations

**Business requirement:** `2.9.1`–`2.9.12`.  
**Current frontend state:** no admin chat, podcast, article, theory, research, comment, request-type, request-review, or plant/fungi management UI.  
**Required frontend changes:** create the 12 management surfaces with active/access/order fields, chat posting/moderation, podcast metadata/audio fields, content editors, comment review/delete, cooperation type/request workflow, taxonomy management, and plant/fungi editors.  
**Affected areas:** new admin community routes/features; customer content/podcast/monograph repositories and GAP-020–023.  
**Acceptance criteria:** all customer community metadata and moderation states originate from one typed mock repository controlled by admin UI.  
**Priority / complexity:** **High / Large**.

### GAP-035 — Build admin health-assessment operations

**Business requirement:** `2.10.1.1`–`2.10.1.4`.  
**Current frontend state:** customer assessment and account history exist; no section/condition management or admin review/export UI exists.  
**Required frontend changes:** add assessment section ordering/status, condition/disease editor with severity options, customer assessment list/filter, read-only detail, and frontend export action. Preserve the no-diagnosis/no-score rule.  
**Affected areas:** new admin health routes/features; assessment schema and account records.  
**Acceptance criteria:** admin-configured sections/conditions render in the customer form; submitted responses can be reviewed/exported without generating results or recommendations.  
**Priority / complexity:** **High / Large**.

### GAP-036 — Build admin subscription operations

**Business requirement:** `2.10.2.1`–`2.10.2.4`.  
**Current frontend state:** customer plan cards and manual-renewal blocking exist; no admin plan or subscription-record UI exists.  
**Required frontend changes:** add plan list/status, plan editor with durations/features/multi-currency prices, a shared rule-state preview, and customer subscription history/filter/detail.  
**Affected areas:** new admin subscription routes/features; shared plan/history contracts.  
**Acceptance criteria:** only active configured plans appear publicly; active-plan and manual-renewal rules are consistent; admin can review current/expired records.  
**Priority / complexity:** **High / Large**.

### GAP-037 — Build admin newsletter operations

**Business requirement:** `2.10.3.1`–`2.10.3.3`.  
**Current frontend state:** customer subscription records exist; no subscriber list, text-message composer, or sent-message log exists.  
**Required frontend changes:** add subscriber list/status actions, immediate text-only composer with required title/body and no unsupported controls, empty-recipient state, and sent-message list/detail/delete-from-log behavior.  
**Affected areas:** new admin newsletter routes/features; newsletter mock repository and GAP-024.  
**Acceptance criteria:** composer targets only confirmed subscribers in the placeholder model; sent count is snapshotted; deleting a log entry does not alter subscriber records.  
**Priority / complexity:** **High / Large**.

### GAP-038 — Build admin AI configuration and connect it to the widget

**Business requirement:** `2.10.4.1`, `2.10.4.2`, supporting `2.10.4.3`.  
**Current frontend state:** no settings/keyword UI and customer behavior is generative.  
**Required frontend changes:** add enable toggle, welcome/fallback fields, keyword list with answer counts/dates, add/edit/delete forms, duplicate validation, at-least-one-answer validation, and shared mock configuration consumed by GAP-025.  
**Affected areas:** new admin AI routes/features; AI widget/client/types.  
**Acceptance criteria:** disabling hides the widget; editing welcome/fallback changes customer text; each keyword has one or more text answers; deleting it removes future matches.  
**Priority / complexity:** **Critical / Large**.

## 7. Validation of previous gap documents

### 7.1 Scope and cross-cutting findings

| Previous finding | Validation | Current conclusion |
|---|---|---|
| Exclude `2.1` and everything after it | **Incorrect** | Only `2.1` is excluded. All `2.2+` admin UI is in scope and missing. |
| Replace mock/localStorage with services/APIs | **Incomplete** | Typed frontend service boundaries and states are valid; replacing placeholders with APIs/backends is out of scope. |
| Remove browser `alert()` calls | **Outdated** | No active `alert()` calls remain outside docs/dependencies. Inline feedback is present. |
| Enforce active/featured/admin selection | **Valid** | Still unresolved in courses, books, home, encyclopedia, search, community, and podcasts. |
| Currency and price filtering | **Valid** | Display formatting exists, but several filters and care prices still use base/hard-coded values. |
| Build real payment/auth/email/backend behavior | **Incorrect** | Production integrations are outside this audit; only frontend contracts, states, and interactions are retained. |
| Feature ownership/legacy cleanup | **Valid, Low business relevance** | Useful maintainability work, but it must follow business-flow corrections rather than lead the roadmap. |

### 7.2 Numbered customer findings from both plans

Both prior documents contain overlapping findings for the same customer use cases. The table below validates each named use-case finding once; duplicate versions inherit the same result.

| Previous section | Validation | Reason after current-code verification |
|---|---|---|
| 1.1 Beginning experience | Valid | Pending intent and protected-route behavior remain inconsistent. |
| 1.2 Home | Incomplete | Several sections now exist, but curated/empty/CTA rules remain. |
| 1.3 Header | Outdated | Required header structure is now present. |
| 1.4 Footer | Valid | Contact/social targets remain incomplete. |
| 1.5 Visitor permissions | Valid | Browsing is broad, but several actions/locked routes do not preserve context. |
| 1.6 Register/login | Incomplete | Terms, confirm password, OTP/reset UI were added; validation/state gaps remain. |
| 1.7 Search | Valid | Current index still omits most named content/service types. |
| 1.8 Education landing | Incomplete | Route exists; selection metadata still uses slices. |
| 1.8.1 Course catalog | Valid | Featuring, duration, currency-filter, and metadata gaps remain. |
| 1.8.2 Course detail | Incomplete | Locked curriculum and CTAs exist; configured installment/share states remain. |
| 1.8.3 Course enrollment/payment | Incomplete | Review/failure/invoice/enrollment now exist; subsequent installments do not. |
| 1.8.4 Course content | Incomplete | Deterministic progress/entitlements were added; completion semantics remain generic. |
| 1.8.5 Course quizzes | Valid | Attempt answers, module completion gates, and full retake rules remain. |
| 1.8.6 Certificate | Incomplete | Certificate record/download exists; eligibility is still wrong in edge cases. |
| 1.8.7 Book catalog | Valid | Metadata, featuring, and currency/format filters remain incomplete. |
| 1.8.8 Book detail | Valid | Format-specific ownership is still contradicted by aggregate IDs. |
| 1.8.9 Book purchase | Incomplete | Review/records/address selection exist; add-address and duplicates remain. |
| 1.8.10 Reader | Incomplete | Ownership gate improved; content is generic and screenshot claim is infeasible. |
| 1.8.11 Encyclopedia page | Valid | Search/filter/editor-pick controls remain non-functional. |
| 1.8.12 Encyclopedia detail | Valid | Favorite/share and active metadata remain incomplete. |
| 1.9.1 Clinics page | Outdated | Required public list/search/category UI is now implemented. |
| 1.9.2 Clinic detail | Incomplete | Core detail exists; money/share/configuration consistency remains. |
| 1.9.3 Clinic booking | Valid | The selected slot is still discarded at checkout. |
| 1.9.4 Consultations page | Incomplete | Individual/package tabs now exist; metadata/money states remain. |
| 1.9.5 Individual booking | Valid | Slot/date integrity and record continuity remain incorrect. |
| 1.9.6 Package purchase | Incomplete | Purchase record exists; session scheduling is missing. |
| 1.9.7 Execution portal | Valid | Current checkout records do not resolve in detail/chat portals. |
| 1.9.8 Trips page | Incomplete | List/filters exist; currency/configuration consistency remains. |
| 1.9.9 Trip detail | Incomplete | Prerequisite/duplicate UI exists; capacity/share/money states remain. |
| 1.9.10 Trip purchase | Incomplete | Checkout/records exist; final capacity check remains. |
| 1.9.11 Clinic initial consultation | Valid | Stored record and eligibility sources are disconnected. |
| 1.9.12 Trip initial consultation | Valid | Stored record and eligibility sources are disconnected. |
| 1.10 Community page | Outdated | All required section entry cards are now present. |
| 1.10.1 Group chat | Incomplete | Storage/expiry were added; history/moderation lifecycle remains. |
| 1.10.2 Podcasts | Incomplete | Global player was added; access metadata and refresh resume remain. |
| 1.10.3 Articles | Valid | Item access/active metadata and interaction gates remain incomplete. |
| 1.10.4 Theories | Valid | Same unresolved access/interaction model. |
| 1.10.5 Researches | Valid | Same unresolved access/interaction model. |
| 1.10.6 Cooperation requests | Outdated | Required frontend form, types, auth gate, attachment input, and confirmation now exist. |
| 1.10.7 Plant/fungi list | Incomplete | Gate/search/filter exist; duplicate model and field drift remain. |
| 1.10.8 Plant/fungi detail | Incomplete | Major field cleanup was completed; shared model/access consistency remains. |
| 1.11 Health assessment | Outdated | Active form/history satisfy the customer frontend requirement. |
| 1.12 Subscription plans | Outdated | Active plans, currencies, checkout, and active-plan blocking now exist. |
| 1.13 Newsletter | Incomplete | Service-backed footer/account exists; home popup bypasses it. |
| 1.14 AI assistant | Valid, with corrected rationale | Main issue is not missing guardrail copy; the entire generative model conflicts with keyword-only requirements. |
| 1.15 Account home | Outdated | Account summary and empty states are implemented. |
| 1.15.1 Profile | Incomplete | Basic save exists; avatar and genuine mock OTP step remain. |
| 1.15.2 Password | Incomplete | UI exists; mock credential state is not changed/verified. |
| 1.15.3 Courses/certificates | Incomplete | Records/downloads exist; eligibility/installment actions remain. |
| 1.15.4 Books | Outdated | Format-specific account list and reader links are present. |
| 1.15.5 Clinic bookings | Valid | List exists; newly stored detail resolution remains inconsistent. |
| 1.15.6 Consultations/packages | Valid | Scheduling and detail/portal continuity remain incomplete. |
| 1.15.7 Trips | Outdated | Purchased-trip list and coordination state are present. |
| 1.15.8 Subscription status | Outdated | Current state/history/manual-renewal presentation exists. |
| 1.15.9 Payments/invoices | Outdated | Status, retry, and downloadable invoice links exist. |
| 1.15.10 Health history | Outdated | History/detail/retake with no diagnosis is implemented. |
| 1.15.11 Favorites | Valid | Shared service exists but eligible content coverage is incomplete. |
| 1.15.12 Notifications | Outdated | List/read-all/delete UI and event records exist. |
| 1.15.13 Newsletter management | Outdated | Pending/confirmed/unsubscribed/resubscribe UI exists. |
| 1.15.14 Logout/delete | Incomplete | UI/cleanup exist; deleted/credential placeholder state remains. |

### 7.3 Previous roadmap findings

- Prior “API/server/gateway/email” tasks are **Incorrect for this audit** and are not merged.
- Prior access, active-content, course-rule, care-state, community-access, favorites, and feature-contract tasks are **Valid or Incomplete** and are represented by GAP-001 through GAP-026.
- Prior tasks marked done were rechecked; several are only partially correct when tested across route-to-record continuity.
- Both prior documents are **Incomplete** because they omit all required admin UI from `2.2` onward.

## 8. Phased frontend roadmap

### Phase 1 — Critical state and access correctness

**Objective:** stop flows that create the wrong entitlement, appointment, or portal state.  
**Gaps:** GAP-001, GAP-008, GAP-009, GAP-010, GAP-015, GAP-016, GAP-018, GAP-025.  
**Dependencies:** shared typed mock repositories for auth intents, purchases, slots, consultations, learning, and AI configuration.  
**Outcome:** customer actions survive auth, grant only the purchased access, preserve selected appointments, unlock prerequisites correctly, and reach the correct portal.

### Phase 2 — Complete customer discovery and commerce

**Objective:** align public discovery, catalogs, details, checkout variants, and account continuity.  
**Gaps:** GAP-002–007, GAP-011–014, GAP-019, GAP-024, GAP-026.  
**Dependencies:** Phase 1 ownership and event sources.  
**Outcome:** every public card/filter/detail/checkout/account path reflects the same metadata, currency, ownership, and lifecycle.

### Phase 3 — Consultation packages and community experience

**Objective:** complete secondary but important customer journeys.  
**Gaps:** GAP-017, GAP-020–023.  
**Dependencies:** unified consultation repository and active/access metadata.  
**Outcome:** package sessions are bookable, community access is predictable, chat has lifecycle states, podcasts honor visibility, and monographs use one schema.

### Phase 4 — Admin foundation and core commercial content

**Objective:** create the missing operational application and its shared mock repositories.  
**Gaps:** GAP-027, GAP-028, GAP-029, GAP-031, GAP-032.  
**Dependencies:** customer contracts stabilized in Phases 1–3.  
**Outcome:** admin users, courses, books, clinics, schedules, consultations, packages, bookings, and doctor workflows can be represented and tested end to end.

### Phase 5 — Admin discovery, trips, and community

**Objective:** make the remaining customer content configurable and reviewable.  
**Gaps:** GAP-030, GAP-033, GAP-034.  
**Dependencies:** shared active/access/order/taxonomy contracts.  
**Outcome:** encyclopedia, trips, podcasts, community content, requests, comments, and plant/fungi content are controlled by admin UI rather than inline mocks.

### Phase 6 — Admin extensions

**Objective:** complete health, subscription, newsletter, and AI management.  
**Gaps:** GAP-035–038.  
**Dependencies:** account event records, subscription/newsletter services, and keyword assistant contract.  
**Outcome:** every business extension has its required admin list/form/detail/log behavior and drives the customer frontend.

### Phase 7 — UX consistency and regression acceptance

**Objective:** consolidate repeated states and verify every coverage-matrix row.  
**Tasks:** shared loading/error/empty/unavailable patterns; bilingual validation; mobile navigation; keyboard/dialog behavior; route-level guest/member/subscriber/admin checks; purchase failure/retry tests; direct-URL access tests; build and lint.  
**Outcome:** one consistent frontend behavior across all roles and business domains.

## 9. Coverage matrix

### 9.1 Customer frontend requirements

| Requirement ID | Business requirement (original use-case title) | Status | Frontend evidence | Gap reference |
|---|---|---|---|---|
| BR-1.1 | بداية تجربة العميل داخل موقع العميل | Partially Implemented ⚠️ | Public routes and conditional header exist; action gates vary by feature. | GAP-001 |
| BR-1.2 | الصفحة الرئيسية لموقع العميل | Partially Implemented ⚠️ | `home-page.tsx` has hero, features, courses, books, testimonials, plans, FAQ; curation/CTA logic differs. | GAP-002, GAP-024 |
| BR-1.3 | الهيدر في موقع العميل | Fully Implemented ✅ | Logo home entry, education/care groups, community, subscriptions, ratings, search, and auth/account switch in `site-layout.tsx:31-143`. | — |
| BR-1.4 | الفوتر في موقع العميل | Partially Implemented ⚠️ | Footer links/form exist; contact data incomplete and social links point to `#`. | GAP-003, GAP-024 |
| BR-1.5 | الزائر في موقع العميل | Partially Implemented ⚠️ | Browsing is broad, but protected-route/action continuation is inconsistent. | GAP-001 |
| BR-1.6 | التسجيل وتسجيل الدخول في موقع العميل | Partially Implemented ⚠️ | Forms, terms, OTP/reset modals exist in `auth-page.tsx`; validation and placeholder lifecycle are incomplete. | GAP-004 |
| BR-1.7 | البحث في موقع العميل | Partially Implemented ⚠️ | `search-index.service.ts` indexes only four result families. | GAP-005 |
| BR-1.8 | قسم التعليم والتعلم في موقع العميل | Partially Implemented ⚠️ | `/education` links all three sections but preview selection uses slices. | GAP-002, GAP-006, GAP-013 |
| BR-1.8.1 | صفحة الدورات داخل قسم التعليم والتعلم | Partially Implemented ⚠️ | Catalog/search/category/price/sort exist; duration/currency/feature metadata incomplete. | GAP-006 |
| BR-1.8.2 | تفاصيل الدورة داخل قسم التعليم والتعلم | Partially Implemented ⚠️ | Locked curriculum and state CTAs exist; configured payment/share states incomplete. | GAP-007 |
| BR-1.8.3 | التسجيل في الدورة والدفع | Partially Implemented ⚠️ | Checkout review/failure/invoice/enrollment exist; later installments/cancel/source return missing. | GAP-008 |
| BR-1.8.4 | متابعة محتوى الدورة | Partially Implemented ⚠️ | Player/progress/resume/entitlements exist; completion semantics are generic. | GAP-009 |
| BR-1.8.5 | الاختبارات داخل الدورة | Partially Implemented ⚠️ | Quiz UI and attempt records exist; module gates, answer history, and retake rules incomplete. | GAP-009 |
| BR-1.8.6 | إكمال الدورة والشهادة | Partially Implemented ⚠️ | Certificate record/download exists; eligibility can omit module quizzes. | GAP-009 |
| BR-1.8.7 | صفحة الكتب داخل قسم التعليم والتعلم | Partially Implemented ⚠️ | Catalog exists; active/featured/currency/format filter rules incomplete. | GAP-010 |
| BR-1.8.8 | تفاصيل الكتاب داخل قسم التعليم والتعلم | Incorrectly Implemented ❌ | Format UI exists, but aggregate ownership disables/unlocks the wrong formats. | GAP-010 |
| BR-1.8.9 | شراء الكتاب | Partially Implemented ⚠️ | Review, saved address, records, failure/retry, invoice exist; add-address/duplicate rules incomplete. | GAP-011 |
| BR-1.8.10 | قراءة الكتاب الإلكتروني | Partially Implemented ⚠️ | `hasEbookAccess` gate and reader exist; content is generic and absolute screenshot prevention is not feasible. | GAP-012 |
| BR-1.8.11 | صفحة الموسوعة داخل قسم التعليم والتعلم | Incorrectly Implemented ❌ | Required sections render, but search/four filters are inert and picks are arbitrary slices. | GAP-013 |
| BR-1.8.12 | تفاصيل عنصر داخل الموسوعة | Partially Implemented ⚠️ | Detail content exists; share/favorite/active states are incomplete. | GAP-013 |
| BR-1.9.1 | صفحة العيادات | Fully Implemented ✅ | Active clinic list, name search, category filter, cards, and empty state in `clinic-page.tsx`. | — |
| BR-1.9.2 | تفاصيل العيادة | Partially Implemented ⚠️ | Detail, doctor, services, favorite, prerequisite CTA exist; share/money/config consistency remains. | GAP-014 |
| BR-1.9.3 | حجز موعد عيادة | Incorrectly Implemented ❌ | Slot is chosen but checkout writes a hard-coded date/time. | GAP-015, GAP-016 |
| BR-1.9.4 | صفحة الاستشارات | Partially Implemented ⚠️ | Individual/package tabs, doctor search, cards and CTAs exist; price/config metadata incomplete. | GAP-014 |
| BR-1.9.5 | حجز الاستشارة الفردية | Incorrectly Implemented ❌ | Selected slot is discarded and generated record/portal continuity is wrong. | GAP-015, GAP-018 |
| BR-1.9.6 | حجز وشراء باقة استشارات | Partially Implemented ⚠️ | Package checkout/record exists; session scheduling and allowance use are missing. | GAP-017 |
| BR-1.9.7 | بوابة تنفيذ الاستشارة | Incorrectly Implemented ❌ | Detail/chat read a different record source; portal IDs and lifecycle do not resolve. | GAP-018 |
| BR-1.9.8 | صفحة الرحلات | Partially Implemented ⚠️ | Active list and filters exist; shared money/config states incomplete. | GAP-014 |
| BR-1.9.9 | تفاصيل باقة الرحلة | Partially Implemented ⚠️ | Features, seats, prerequisite, duplicate and coordination copy exist; share/money/capacity state incomplete. | GAP-014, GAP-019 |
| BR-1.9.10 | شراء باقة الرحلة | Partially Implemented ⚠️ | Checkout/payment/invoice/account record exist; final capacity re-check missing. | GAP-019 |
| BR-1.9.11 | حجز وتنفيذ الاستشارة الأولية الخاصة بالعيادة | Incorrectly Implemented ❌ | Purchase writes feature storage; eligibility reads `user.consultations`; no completion transition. | GAP-016 |
| BR-1.9.12 | حجز وتنفيذ الاستشارة الأولية العامة الخاصة بالرحلات | Incorrectly Implemented ❌ | Same disconnected record/eligibility lifecycle as clinic prerequisite. | GAP-016 |
| BR-1.10 | صفحة المجتمع | Fully Implemented ✅ | Community landing renders all required section entries and lock indicators. | — |
| BR-1.10.1 | المحادثة الجماعية للمشتركين | Partially Implemented ⚠️ | Subscriber text chat/storage/expiry exist; history and moderation states incomplete. | GAP-021 |
| BR-1.10.2 | تصفح وتشغيل حلقات البودكاست | Partially Implemented ⚠️ | Episode list and global player exist; access metadata and refresh resume missing. | GAP-022 |
| BR-1.10.3 | تصفح وقراءة المقالات | Partially Implemented ⚠️ | List/detail/likes/comments exist without complete active/access rules. | GAP-020 |
| BR-1.10.4 | تصفح وقراءة النظريات | Partially Implemented ⚠️ | List/detail/likes/comments exist without complete active/access rules. | GAP-020 |
| BR-1.10.5 | تصفح وقراءة الأبحاث | Partially Implemented ⚠️ | List/detail/likes/comments exist without complete active/access rules. | GAP-020 |
| BR-1.10.6 | إرسال طلب تعاون أو اقتراح | Fully Implemented ✅ | Auth-gated type, contact, title, description, attachment input, confirmation, and local record exist. | — |
| BR-1.10.7 | تصفح موسوعة النباتات والفطريات | Partially Implemented ⚠️ | Subscriber gate/search/type filter/cards exist; data/schema consistency incomplete. | GAP-023 |
| BR-1.10.8 | عرض تفاصيل نبات أو فطر | Partially Implemented ⚠️ | Detail and favorite exist; shared data/access/field consistency incomplete. | GAP-023 |
| BR-1.11 | تعبئة وإرسال التقييم الصحي | Fully Implemented ✅ | Auth-gated sections, severity choices, notes, submission, and no-result confirmation exist. | — |
| BR-1.12 | تصفح وشراء خطط الاشتراك | Fully Implemented ✅ | Active plans, multi-currency prices, checkout, manual renewal, and active-plan block exist. | — |
| BR-1.13 | الاشتراك في النشرة الإلكترونية وإلغاؤها | Partially Implemented ⚠️ | Footer/account service flow exists; home popup bypasses the record model. | GAP-024 |
| BR-1.14 | استخدام مساعد B3 الذكي | Incorrectly Implemented ❌ | Current widget is generative/history-aware rather than keyword/predefined-response based. | GAP-025, GAP-038 |
| BR-1.15 | عرض الصفحة الرئيسية للحساب الشخصي | Fully Implemented ✅ | Account shell, summary counts, next appointment, payments, and empty states exist. | — |
| BR-1.15.1 | عرض وتعديل البيانات الشخصية | Partially Implemented ⚠️ | Name/phone/email UI exists; avatar and entered OTP validation missing. | GAP-004, GAP-026 |
| BR-1.15.2 | تغيير كلمة مرور الحساب | Partially Implemented ⚠️ | Form exists; mock credential is neither verified nor changed. | GAP-004, GAP-026 |
| BR-1.15.3 | عرض الدورات المسجلة والشهادات | Partially Implemented ⚠️ | Courses/progress/installments/certificates render; eligibility and next-payment action incomplete. | GAP-008, GAP-009, GAP-026 |
| BR-1.15.4 | عرض الكتب المشتراة | Fully Implemented ✅ | Format-specific purchase list, shipment status, detail and reader links exist. | — |
| BR-1.15.5 | عرض حجوزات العيادات | Partially Implemented ⚠️ | List exists; newly stored records do not consistently resolve in detail. | GAP-015, GAP-026 |
| BR-1.15.6 | عرض الاستشارات والجلسات المحجوزة | Partially Implemented ⚠️ | Records list exists; package scheduling and portal/detail continuity are incomplete. | GAP-017, GAP-018, GAP-026 |
| BR-1.15.7 | عرض باقات الرحلات المشتراة | Fully Implemented ✅ | Purchased package/status/coordination account list exists. | — |
| BR-1.15.8 | عرض حالة الاشتراك | Fully Implemented ✅ | Current status, expiry, manual renewal, and history exist. | — |
| BR-1.15.9 | عرض سجل المدفوعات والفواتير | Fully Implemented ✅ | Status/date/amount, retry, and downloadable invoice link exist. | — |
| BR-1.15.10 | عرض وإعادة التقييم الصحي | Fully Implemented ✅ | History/detail/retake exists without score, diagnosis, or recommendation. | — |
| BR-1.15.11 | عرض وإدارة العناصر المفضلة | Partially Implemented ⚠️ | Shared list/remove exists; eligible content coverage and unavailable states incomplete. | GAP-013, GAP-020, GAP-023, GAP-026 |
| BR-1.15.12 | عرض وإدارة الإشعارات | Fully Implemented ✅ | List, read/read-all, delete and local event generation exist. | — |
| BR-1.15.13 | إدارة الاشتراك في النشرة الإلكترونية | Fully Implemented ✅ | Pending/confirmed/unsubscribed/resubscribe account states exist. | — |
| BR-1.15.14 | تسجيل الخروج أو حذف الحساب | Partially Implemented ⚠️ | Logout, confirmation, cleanup/anonymization exist; credential/deleted-account state incomplete. | GAP-004, GAP-026 |

### 9.2 Admin and operational frontend requirements

For every missing row below, the verified evidence is the same root fact: `src/app` contains no `/admin` route group and `src/features` contains no admin management feature. Domain-specific mock customer services do not substitute for admin screens.

| Requirement ID | Business requirement (original use-case title) | Status | Frontend evidence | Gap reference |
|---|---|---|---|---|
| BR-2.1 | عرض الصفحة الرئيسية للوحة التحكم | Excluded — Dashboard Scope | Read for context only; exclusion is documented in Appendix A. | — |
| BR-2.2.1 | عرض وإدارة قائمة المستخدمين | Missing ❌ | No admin user list/table/filter/actions. | GAP-027 |
| BR-2.2.2 | إضافة حساب مستخدم من لوحة التحكم | Missing ❌ | No admin add-user form. | GAP-027 |
| BR-2.2.3 | عرض الملف الكامل للمستخدم | Missing ❌ | No admin customer activity/profile detail. | GAP-027 |
| BR-2.2.4 | تعديل بيانات المستخدم وتغيير حالة حسابه | Missing ❌ | No admin user edit or active/inactive/blocked controls. | GAP-027 |
| BR-2.3.1 | عرض وإدارة قائمة الدورات | Missing ❌ | No admin course table/status actions. | GAP-028 |
| BR-2.3.2 | إضافة أو تعديل البيانات الأساسية للدورة | Missing ❌ | No admin course editor. | GAP-028 |
| BR-2.3.3 | إدارة أقسام ودروس ومحتوى الدورة | Missing ❌ | No curriculum/content builder. | GAP-028 |
| BR-2.3.4 | إنشاء وإدارة اختبارات الدورة | Missing ❌ | No admin quiz/final-exam builder. | GAP-028 |
| BR-2.3.5 | إعداد وإدارة شهادة إكمال الدورة | Missing ❌ | No admin certificate settings/template UI. | GAP-028 |
| BR-2.3.6 | عرض طلاب الدورة ومتابعة تقدمهم | Missing ❌ | No admin enrollment/progress view. | GAP-028 |
| BR-2.3.7 | إدارة تصنيفات ومستويات الدورات | Missing ❌ | No category/level manager. | GAP-028 |
| BR-2.4.1 | عرض وإدارة قائمة الكتب | Missing ❌ | No admin book table/status actions. | GAP-029 |
| BR-2.4.2 | إضافة أو تعديل بيانات كتاب | Missing ❌ | No book editor or per-format configuration. | GAP-029 |
| BR-2.4.3 | إدارة تصنيفات الكتب | Missing ❌ | No book category manager. | GAP-029 |
| BR-2.4.4 | رفع وإدارة ملف الكتاب الإلكتروني | Missing ❌ | No ebook-file metadata/upload UI. | GAP-029 |
| BR-2.4.5 | عرض وإدارة سجل مشتريات الكتب | Missing ❌ | No admin purchases/printed-orders table. | GAP-029 |
| BR-2.4.6 | عرض العملاء المشترين لكتاب محدد | Missing ❌ | No per-book buyer view. | GAP-029 |
| BR-2.5.1 | عرض وإدارة قائمة أخبار الموسوعة | Missing ❌ | No encyclopedia news manager. | GAP-030 |
| BR-2.5.2 | إضافة أو تعديل خبر في الموسوعة | Missing ❌ | No encyclopedia news editor. | GAP-030 |
| BR-2.5.3 | تحديد أخبار اختيارات المحرر | Missing ❌ | No explicit editor-pick/order manager. | GAP-030 |
| BR-2.5.4 | إدارة الفلاتر الأربعة وأنواعها في مكتبة الأعشاب | Missing ❌ | No filter-dimension/type manager. | GAP-030 |
| BR-2.5.5 | عرض وإدارة قائمة الأعشاب | Missing ❌ | No herb list/status manager. | GAP-030 |
| BR-2.5.6 | إضافة أو تعديل عنصر في مكتبة الأعشاب | Missing ❌ | No herb editor. | GAP-030 |
| BR-2.6.1 | عرض وإدارة قائمة العيادات | Missing ❌ | No admin clinic table/status actions. | GAP-031 |
| BR-2.6.2 | إضافة أو تعديل بيانات العيادة والطبيب | Missing ❌ | No clinic/doctor editor. | GAP-031 |
| BR-2.6.3 | إدارة تصنيفات العيادات | Missing ❌ | No clinic category manager. | GAP-031 |
| BR-2.6.4 | إدارة الخدمات العامة الظاهرة في قسم الرعاية | Missing ❌ | No public care-service manager. | GAP-031 |
| BR-2.6.5 | إعداد وإدارة جدول المواعيد الموحد للطبيب | Missing ❌ | No doctor schedule builder. | GAP-031, GAP-032 |
| BR-2.6.6 | إعداد قواعد حجز المواعيد الحضورية | Missing ❌ | No in-person booking-rule UI. | GAP-031 |
| BR-2.6.7 | إعداد الاستشارة الأولية المرتبطة بالطبيب والعيادة | Missing ❌ | No clinic prerequisite settings. | GAP-031, GAP-016 |
| BR-2.6.8 | عرض وإدارة حجوزات العيادات | Missing ❌ | No admin clinic booking list/detail/close actions. | GAP-031 |
| BR-2.7.1 | عرض أطباء الاستشارات وإدارة إعداداتهم | Missing ❌ | No consultation doctor settings. | GAP-032 |
| BR-2.7.2 | إعداد أنواع الاستشارات الفردية للطبيب | Missing ❌ | No individual consultation-type editor. | GAP-032 |
| BR-2.7.3 | إضافة وتعديل وإدارة باقات الاستشارات | Missing ❌ | No admin package CRUD. | GAP-032 |
| BR-2.7.4 | عرض وإغلاق حجوزات الاستشارات | Missing ❌ | No admin booking management/close UI. | GAP-032 |
| BR-2.7.5 | عرض مشتريات باقات الاستشارات وجلساتها | Missing ❌ | No package purchase/session management UI. | GAP-032 |
| BR-2.7.6 | استخدام بوابة الطبيب للمواعيد والاستشارات | Missing ❌ | No doctor-facing route or unified portal. | GAP-032 |
| BR-2.8.1 | عرض وإدارة قائمة باقات الرحلات | Missing ❌ | No admin trip table/status actions. | GAP-033 |
| BR-2.8.2 | إضافة أو تعديل باقة رحلة | Missing ❌ | No trip editor/capacity warning UI. | GAP-033 |
| BR-2.8.3 | إدارة تصنيفات باقات الرحلات | Missing ❌ | No trip category manager. | GAP-033 |
| BR-2.8.4 | عرض وتصدير مشتريات باقات الرحلات | Missing ❌ | No admin purchase/filter/export view. | GAP-033 |
| BR-2.8.5 | إعداد الاستشارة الأولية العامة المطلوبة لشراء الرحلات | Missing ❌ | No trip prerequisite settings. | GAP-033, GAP-016 |
| BR-2.9.1 | إدارة محادثة المجتمع الجماعية | Missing ❌ | No admin chat post/moderation UI. | GAP-034 |
| BR-2.9.2 | عرض وإدارة قائمة حلقات البودكاست | Missing ❌ | No podcast manager. | GAP-034 |
| BR-2.9.3 | إضافة أو تعديل حلقة بودكاست | Missing ❌ | No podcast editor. | GAP-034 |
| BR-2.9.4 | إضافة وعرض وإدارة المقالات | Missing ❌ | No article admin CRUD. | GAP-034 |
| BR-2.9.5 | إضافة وعرض وإدارة النظريات | Missing ❌ | No theory admin CRUD. | GAP-034 |
| BR-2.9.6 | إضافة وعرض وإدارة الأبحاث والدراسات | Missing ❌ | No research admin CRUD. | GAP-034 |
| BR-2.9.7 | مراجعة وحذف التعليقات | Missing ❌ | No comment moderation queue. | GAP-034 |
| BR-2.9.8 | إدارة أنواع التعاون والاقتراحات | Missing ❌ | Customer types are constants; no admin type manager. | GAP-034 |
| BR-2.9.9 | عرض ومراجعة طلبات التعاون والاقتراحات | Missing ❌ | No admin request review/status UI. | GAP-034 |
| BR-2.9.10 | إدارة تصنيفات النباتات والفطريات | Missing ❌ | No plant/fungi taxonomy manager. | GAP-034 |
| BR-2.9.11 | عرض وإدارة عناصر موسوعة النباتات والفطريات | Missing ❌ | No admin monograph list/status UI. | GAP-034 |
| BR-2.9.12 | إضافة أو تعديل عنصر في موسوعة النباتات والفطريات | Missing ❌ | No admin monograph editor. | GAP-034 |
| BR-2.10.1.1 | عرض وإدارة أقسام التقييم الصحي | Missing ❌ | No assessment-section manager. | GAP-035 |
| BR-2.10.1.2 | إدارة الحالات والأمراض التابعة لأقسام التقييم | Missing ❌ | No condition/disease/severity editor. | GAP-035 |
| BR-2.10.1.3 | عرض ومراجعة تقييمات العملاء الصحية | Missing ❌ | No admin assessment list/filter/review UI. | GAP-035 |
| BR-2.10.1.4 | عرض تفاصيل تقييم العميل وتصديره | Missing ❌ | No admin detail/export UI. | GAP-035 |
| BR-2.10.2.1 | عرض وإدارة خطط الاشتراك | Missing ❌ | No admin plan list/status UI. | GAP-036 |
| BR-2.10.2.2 | إضافة أو تعديل خطة اشتراك | Missing ❌ | No plan editor. | GAP-036 |
| BR-2.10.2.3 | تطبيق قواعد شراء وتجديد الاشتراك | Partially Implemented ⚠️ | Customer UI blocks active-plan purchase and states manual renewal; universal expiry/config preview is incomplete. | GAP-036 |
| BR-2.10.2.4 | عرض ومراجعة اشتراكات العملاء | Missing ❌ | No admin customer subscription history. | GAP-036 |
| BR-2.10.3.1 | عرض وإدارة قائمة المشتركين في النشرة البريدية | Missing ❌ | No admin subscriber list/status actions. | GAP-037 |
| BR-2.10.3.2 | إنشاء وإرسال رسالة نشرة بريدية | Missing ❌ | No text-only immediate composer. | GAP-037 |
| BR-2.10.3.3 | عرض وإدارة سجل رسائل النشرة البريدية | Missing ❌ | No sent-message list/detail/delete-log UI. | GAP-037 |
| BR-2.10.4.1 | إدارة الإعدادات العامة لمساعد B3 AI | Missing ❌ | No enable/welcome/fallback settings UI. | GAP-038 |
| BR-2.10.4.2 | إضافة وتعديل الكلمات المفتاحية وإجابات المساعد | Missing ❌ | No keyword/answer manager. | GAP-038 |
| BR-2.10.4.3 | استخدام المساعد وفق الكلمات المفتاحية | Incorrectly Implemented ❌ | Existing widget generates AI responses from history instead of configured keyword answers. | GAP-025, GAP-038 |

## 10. Final frontend readiness assessment

The frontend is a strong customer-facing prototype, not a business-complete application. Fourteen use cases are fully represented, and the build is healthy, but 114 use cases still map to actionable frontend work. The customer application can reach most major destinations; its main risk is that several successful-looking flows create records that later pages cannot consume or that grant the wrong entitlement. Those lifecycle defects should be corrected before adding more page polish.

The full business alignment target also requires a separate admin frontend surface inside this repository unless product ownership explicitly removes sections `2.2+` from scope. Under the current instruction they are required: 66 are wholly absent, one is partial, and one is implemented with the wrong behavior. Completing the roadmap means first stabilizing shared frontend contracts, then building customer and admin interfaces against the same mock adapters so Laravel integration can later replace those adapters without changing the user experience.

## Appendix A — Dashboard Requirements Excluded From Scope

The exclusion applies only to `BR-2.1 — عرض الصفحة الرئيسية للوحة التحكم` and the requirements contained in that use case:

- Overall platform performance summary for admins.
- KPI cards for total users, active users, active subscriptions, total revenue, course sales, book sales, clinic bookings, consultation bookings, and trip-package purchases.
- Default all-time totals and a time-period filter.
- Time-filtered revenue chart.
- Time-filtered new-user registration chart.
- Sales chart split by courses, books, subscriptions, and trips.
- Booking chart split by clinics, individual consultations, package sessions, initial consultations, and other care services.
- Subscription chart for new and expired subscriptions.
- Revenue/sales totals based only on successful paid transactions.
- Booking totals based only on confirmed paid bookings.
- Zero/empty behavior for periods without data.
- No quick-actions section.
- No detailed latest-bookings or latest-requests lists.
- Navigation from the dashboard to user management and specialized sales/booking modules.

No implementation task or roadmap item has been created for these excluded dashboard-summary requirements.
