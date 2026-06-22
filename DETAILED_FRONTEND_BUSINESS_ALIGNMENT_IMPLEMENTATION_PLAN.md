# B3 Academy — Definitive Frontend Business Alignment Implementation Plan

> **Single source of truth** for aligning the B3 Academy frontend (Next.js App Router, frontend‑only) with the business requirements document `B3 Academy new.docx`.
>
> A developer should be able to implement the entire customer‑facing frontend from this document **without re‑reading** the business document.

---

## 0. How To Read This Document

This plan is organized so you can work top‑to‑bottom:

1. **Scope & Method** — what is in/out of scope and how the audit was performed.
2. **Executive Findings** — counts and the headline cross‑cutting problems.
3. **Complete Audit Findings** — every customer‑facing requirement (1.1 → 1.15.14) classified with code evidence.
4. **Implementation Phases (1 → 8)** — the roadmap. Each phase contains its **Goal, Business Requirements Covered, Screens Affected, Components Affected, User Flows Affected, Implementation Tasks**, and the **per‑gap detail** (Business Requirement, Current State, Gap Analysis, Required Changes, Priority, Complexity) for every gap it closes.
5. **Validation of Previous Gap Documents** — `UI_BUSINESS_GAP_PLAN.md` and `UI_BUSINESS_MISSING_GAPS_PLAN.md` findings classified Valid / Incomplete / Incorrect / Outdated.
6. **Requirement Coverage Matrix** — every business requirement with status, evidence, and phase.
7. **Appendix A — Dashboard Requirements Excluded From Scope** — all Section 2 (لوحة التحكم) requirements, listed for context only.

### Classification legend

| Symbol | Meaning |
| ------ | ------- |
| ✅ Fully Implemented | Matches the business requirement. |
| ⚠️ Partially Implemented | Exists but incomplete. |
| ❌ Incorrectly Implemented | Exists but behaves differently from the requirement. |
| ❌ Missing | Does not exist. |
| ⛔ Excluded | Dashboard‑only requirement (Section 2). Context only — no tasks. |

### Priority / Complexity scales

- **Priority:** Critical · High · Medium · Low
- **Complexity:** Small (≤1 day) · Medium (2–4 days) · Large (1–2+ weeks)

---

## 1. Scope & Method

### 1.1 Project context

- The repository is a **frontend‑only Next.js (App Router) application**. The backend will be built separately in **Laravel**.
- Persistence today is **mock data + `localStorage`** (registry in `src/lib/storage/safe-local-storage.ts`). This is the intended prototype substrate; production gateway/email/server persistence are **out of scope**.

### 1.2 Explicitly out of scope (do **not** create tasks for these)

- Backend / Laravel development, database design, API development.
- Authentication architecture, payment gateway integration, notification infrastructure, server‑side business logic.
- The **entire Admin Dashboard / Control Panel (لوحة التحكم, Section 2: use cases `2.1` → `2.10.4.3`)**. Per the Dashboard Exclusion Rule, `2.1 الصفحة الرئيسية للوحة التحكم` **and everything under it** is excluded. These are listed in **Appendix A** for context only.
  - Note: the repo already contains scaffolded `(admin)` and `(doctor)` route groups. They are **not** part of this customer‑facing plan and are intentionally ignored except where a customer flow depends on data an admin would configure (in which case the customer side must read frontend flags/mock config, never build the admin screen here).

### 1.3 In scope

Section 1 (موقع العميل — the customer site), use cases **1.1 → 1.15.14**: UI, UX, screens, forms, navigation, user journeys, frontend workflows, frontend states, content presentation, and frontend business alignment.

### 1.4 Audit method

1. Extracted and read the business document **line‑by‑line** (4,577 lines; 50 customer use cases in Section 1).
2. Inventoried **every** route, feature module, component, service, mock dataset and `localStorage` key in the codebase.
3. Verified each requirement **directly against the code** (file + line evidence), not relying on prior gap documents.
4. Re‑validated the two prior gap documents and the prior audit/plan against the current tree.

### 1.5 Codebase shape (verified)

- Customer routes live under `src/app/(site)`, `(account)`, `(community)`, `(library)`, `(learn)`, `(auth)`, `(checkout)`.
- Feature modules under `src/features/*` (≈25 modules) own components/services/types; persistence via `src/lib/storage/safe-local-storage.ts`.
- Navigation (header + footer) is centralized in `src/features/navigation/components/site-layout.tsx`.
- Canonical seed data in root `data.ts` plus per‑feature `*.mock.ts` and service‑seeded stores.

---

## 2. Executive Findings

### 2.1 Headline

The customer frontend is **broadly scaffolded** — routing, header/footer, auth flow, guest gating, checkout review/payment lifecycle, slot booking, account sections, search skeleton, and a keyword AI widget all exist. **However, almost no requirement is fully aligned**: the audit found **0 areas fully matching the written spec end‑to‑end**, with the majority **partially implemented** and a cluster of **incorrectly implemented** flows that break core journeys.

### 2.2 Status counts (customer scope, 50 use cases)

| Status | Count | Use cases |
| ------ | ----- | --------- |
| ✅ Fully | 0 | — |
| ⚠️ Partial | 41 | 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8.1–1.8.12, 1.9.1–1.9.5, 1.9.7–1.9.10, 1.10, 1.10.2–1.10.4, 1.10.6, 1.10.7, 1.10.8, 1.11, 1.12, 1.13, 1.14, 1.15, 1.15.1–1.15.8, 1.15.10–1.15.12, 1.15.14 |
| ❌ Incorrect | 6 | 1.9.6, 1.9.11, 1.9.12, 1.10.1, 1.10.5, plus the duplicate `/encyclopedia` vs `/monograph` product |
| ✅ Effectively complete (minor) | 3 | 1.3 (header), 1.15.9 (payments), 1.15.13 (newsletter mgmt) |
| ⛔ Excluded | All of Section 2 | See Appendix A |

> "Fully" is reserved for end‑to‑end spec match; 1.3 / 1.15.9 / 1.15.13 are listed as effectively complete with only cosmetic deltas.

### 2.3 Cross‑cutting (architectural) findings — fix these first

These defects span many requirements and **must** be resolved before per‑screen polish:

- **CC‑1 — Consultation completion lifecycle is missing (CRITICAL).** Nothing in the code ever sets a consultation record to `status: 'completed'`. The clinic/trip **initial‑consultation prerequisites** require `completed` (`care-prerequisite.service.ts:46–48`), so once booked they **never unlock** — clinic appointment booking (1.9.3) and trip purchase (1.9.10) are permanently blocked for any honest flow.
- **CC‑2 — Subscription expiry is not enforced.** Gating reads `Boolean(user?.isSubscribed)` without checking `subscriptionExpiryDate` (e.g. `community-content.service.ts:214`, `monograph.service.ts:63`). Expired users keep locked‑content access (everywhere except group chat), and cannot be correctly re‑prompted to renew. Affects 1.10.x, 1.12, monograph 1.10.7/1.10.8, favorites 1.15.11.
- **CC‑3 — Initial‑consultation prerequisite is only checked on detail pages.** The `/book` routes and `checkout-page.tsx` do not re‑check it, so it is bypassable via direct URL. Affects 1.9.1, 1.9.2, 1.9.3, 1.9.8, 1.9.10.
- **CC‑4 — Storage vs `user` object split.** Clinic booking detail reads `user.clinicBookings` (`clinic-booking-detail.tsx:27`) while checkout writes to storage (`addStoredClinicBooking`); the route param is `[bookingId]` but the component reads `id`. Real bookings don't render. Affects 1.9.3, 1.15.5.
- **CC‑5 — Currency not applied to care pricing.** Trips/consultations/clinic prices are hard‑coded literals / `$` and ignore `CurrencyContext`. Affects 1.8.x partly and 1.9.x broadly.
- **CC‑6 — Featured/active flags are mock‑seeded by index** (`isFeatured: index < N`). Helper APIs (`getFeatured*`, `getActive*`) exist and are used; the underlying seed must be driven by explicit flags so "admin‑selected only" semantics are demonstrable on the frontend.
- **CC‑7 — Community interactions use a dual data stack:** list pages read root contexts (`BlogContext`/`TheoryContext`/`ResearchContext`) and skip `getActiveBlogs/Theories/Researches()` + access metadata, so inactive items can list and access badges are missing. Affects 1.10.3–1.10.5.
- **CC‑8 — Two competing encyclopedia products.** Education `/encyclopedia` (free, news + editor picks + herbal library with 4 filters) and community `/monograph` (subscriber‑only plants/fungi). The business doc maps these to **different** use cases (1.8.11/1.8.12 vs 1.10.7/1.10.8). The `/monograph` page implements the wrong filter model (type‑only instead of a single admin category filter) and is missing fields/share.

---

## 3. Complete Audit Findings (Requirement‑by‑Requirement)

Each entry: **classification + concise evidence**. Detailed gap closure (current state, gap, required changes, priority, complexity) is in the phase that owns the fix (Section 4); the owning phase is noted.

### 3.1 Foundation (1.1 – 1.7)

**1.1 بداية تجربة العميل (Customer start) — ⚠️ Partial** · *Phase 8*
Guest lands on home and browses; header swaps login↔account (`site-layout.tsx:91–97`); service actions gate via `AuthActionGate`/`savePendingIntent`; resume‑after‑auth works (`auth-page.tsx:34–39`). Delta: subscriber‑gated community content differs for guests (expected) but some screens show *login*-required messaging when *subscription* is the true gate.

**1.2 الصفحة الرئيسية (Homepage) — ⚠️ Partial** · *Phase 8*
Hero, two CTAs (`/education`, `/consultations`), features, featured courses (`getFeaturedCourses(3)`), featured books, testimonials, FAQ, header/footer all present (`home-page.tsx`). Deltas: a **timed newsletter popup overlay** (3s) conflicts with "no advertising banners"; subscription CTAs link to `/auth?mode=register` instead of `/subscriptions`; "selected books" uses "latest books" copy.

**1.3 الهيدر (Header) — ✅ Effectively complete** · *no work (minor)*
Logo→home, Education/Care/Community/Subscriptions/Ratings, Education dropdown (Courses/Books/Encyclopedia), Care dropdown (Clinics/Consultations/Trips), search, login/account (`site-layout.tsx:29–97`). Minor: confirm mobile submenu parity.

**1.4 الفوتر (Footer) — ⚠️ Partial** · *Phase 8*
Logo+blurb, secondary links, contact (`SITE_CONTACT`), legal (terms/privacy), newsletter field present. Deltas: no `/education` or care "overview" links in footer columns; newsletter has only HTML5 validation; guest newsletter path pushes login (see 1.13).

**1.5 الزائر (Visitor limits) — ⚠️ Partial** · *Phase 8 / CC‑2*
Guest browses; actions gated; "keep browsing" cancel works. Delta: some community items use login messaging where subscription is the gate; consistent browse‑vs‑act policy needs the CC‑2 expiry fix.

**1.6 التسجيل وتسجيل الدخول (Register/Login) — ⚠️ Partial** · *Phase 2*
Register fields (name, phone+country via `PhoneInput`, email, password, confirm), mandatory terms, **OTP on register**, account activation, resume‑after‑action, login, **forgot/reset via email OTP** all present (`auth-page.tsx`). Deltas: **no resend‑OTP control**; email format relies on HTML5 only.

**1.7 البحث (Site search) — ⚠️ Partial** · *Phase 7*
Header search → `/search`; site‑wide index over courses/books/encyclopedia/community/blogs/research/clinics/consultations/trips; text‑only; grouped results; empty state; result→detail (`search-index.service.ts`, `search-page.tsx`). Deltas: **FAQ, subscriptions, monographs not indexed**; `kindLabels` only covers 4 kinds so others show raw keys.

### 3.2 Education — Courses & Learning (1.8 – 1.8.6)

**1.8 قسم التعليم والتعلم (Education hub) — ⚠️ Partial** · *Phase 3/5*
`/education` hub links Courses/Books/Encyclopedia (`education-page.tsx`); light on selected‑content previews/counts.

**1.8.1 صفحة الدورات (Courses list) — ⚠️ Partial** · *Phase 3*
Active‑only, featured section, category tabs, search, price/hours/sort filters, paid‑only, enrolled badge all present. Deltas: **no currency filter control** on catalog; duration filtered in **minutes not hours**; category badge/level not localized; an out‑of‑spec **level filter** exists.

**1.8.2 تفاصيل الدورة (Course detail) — ⚠️ Partial** · *Phase 3*
Image/trailer, name, desc, level, category, hours, price, instructor name only, **closed curriculum titles**, full/installment indication, similar‑by‑category, enroll/continue states, no reviews — all present. Delta: single `description` field used for both summary and detailed; guest pending‑intent saves the *checkout* href rather than the course detail.

**1.8.3 التسجيل في الدورة والدفع (Enroll & pay) — ⚠️ Partial** · *Phase 3*
Checkout review, full vs installment‑per‑section unlock, already‑enrolled block exist. Deltas: **no checkout‑level currency changer**; **success redirects to `/dashboard/payments`, not into course content**; "email confirmation" is metadata only; installment UI shows for full‑only courses.

**1.8.4 متابعة محتوى الدورة (Course content) — ⚠️ Partial (sequential order ❌ Missing)** · *Phase 3*
Sections/lessons, progress %, last position, installment gating, quiz submit all present. **Forced sequential lesson order is NOT enforced** (`isLessonAccessible` checks only installment entitlement, `course-progress.service.ts:59–65`); video needs manual "Mark Complete"; no inline "pay next section" in the player.

**1.8.5 الاختبارات (Quizzes) — ⚠️ Partial** · *Phase 3*
MCQ, mid/end/final placement, no timer, attempt‑on‑submit, instant result, stored record, section quizzes don't block next, admin pass score, fail=counts only, pass=detailed answers, final‑exam‑gates‑completion all present. Delta: course `c2` capped at 2 attempts (`courses.service.ts:99`) vs "unlimited".

**1.8.6 إكمال الدورة والشهادة (Completion & certificate) — ⚠️ Partial** · *Phase 3*
Auto eval, certificate‑enabled flag, auto‑issue, template with name/course/date/unique ID, installments‑paid requirement, no QR all present. Delta: download is an **`.html` data URL, not PDF**; in‑app notification (no email — acceptable for frontend).

### 3.3 Education — Books & Encyclopedia (1.8.7 – 1.8.12)

**1.8.7 صفحة الكتب (Books list) — ⚠️ Partial** · *Phase 5*
Active‑only, featured, topic tabs, search, price+sort, guest browse present. Deltas: cards **missing short desc, category badge, version‑type badges**; ownership shown generically; **no currency filter**; **no version‑type filter**; price filter uses raw `prices.ebook` without conversion.

**1.8.8 تفاصيل الكتاب (Book detail) — ⚠️ Partial (closest to complete)** · *Phase 5*
Cover, name, author, desc, category, per‑format price, version types, ownership, choose‑version, read‑if‑owned, buy‑other‑later, similar‑by‑category, no reviews all present.

**1.8.9 شراء الكتاب (Book purchase) — ⚠️ Partial** · *Phase 5*
Version choice → checkout, guest login→return, ebook=no shipping, print/both=address required, can't‑rebuy/can‑buy‑other present. Deltas: **no admin print‑order workflow** (record stored locally only); no inline address create/edit (CC‑5 currency too); invoice/email are in‑app metadata.

**1.8.10 قراءة الكتاب الإلكتروني (Ebook reader) — ⚠️ Partial** · *Phase 5*
In‑platform reader, no download links, ownership gate, reading‑position save present; screenshot prevention is best‑effort (`userSelect:none`, contextmenu block, watermark) — true prevention infeasible in browser (document as limitation).

**1.8.11 صفحة الموسوعة (Education encyclopedia) — ⚠️ Partial** · *Phase 5 / CC‑8*
`/encyclopedia` = news/articles + editor picks + herbal library with 4 combinable filters (`type/family/sex/origin`), free browse. Deltas: news section has **no search**; confirm mapping vs community plants encyclopedia (CC‑8).

**1.8.12 تفاصيل عنصر الموسوعة (Encyclopedia item detail) — ⚠️ Partial** · *Phase 5*
Article: image/title/content/category, share, favorite (login) present; **publish date not shown**. Herb: properties/family/origin present; **the 4th category dimension (`herbType`) not displayed** (header uses `category` plants/fungi).

### 3.4 Care — Clinics, Consultations, Trips (1.9.1 – 1.9.12)

**1.9.1 صفحة العيادات (Clinics page) — ⚠️ Partial** · *Phase 4 / CC‑3*
Active‑only, name search, doctor↔clinic 1:1, cards (image/name/address/desc/specialties) present. Deltas: category tabs always rendered (not "only if admin added"); **no general grouped‑services section**; **no direct‑booking action on list**; prerequisite only enforced on detail.

**1.9.2 تفاصيل العيادة (Clinic detail) — ⚠️ Partial** · *Phase 4 / CC‑3*
Image/desc/address/category, specialties as text, doctor info, no phone, no hours, share, favorite present. Deltas: **disabled clinic not accessible to existing‑booking holders** (lookup returns active only); prerequisite bypassable via `/book` URL.

**1.9.3 حجز موعد عيادة (Clinic appointment booking) — ⚠️ Partial** · *Phase 4 / CC‑1,CC‑3,CC‑4,CC‑5*
Login+return, slot‑locks‑only‑on‑payment, first‑to‑pay‑wins, review+pay‑no‑approval present. Deltas: **no doctor/clinic switcher**, **no prerequisite re‑check**, **no editable account data + notes**, **static mock slots (no admin duration/working‑days/min‑lead)**, all slots in one grid (no day→times), **no 2‑active‑booking guard**, **no auto "done" status**, detail/storage split (CC‑4).

**1.9.4 صفحة الاستشارات (Consultations page) — ⚠️ Partial** · *Phase 4*
Two tabs (individual/packages), independence copy, doctor search, package cards present. Deltas: **consultation types hardcoded video/text+prices for all doctors** (not per‑doctor admin config); linked clinic not shown; **booked/purchased state not shown**; doctors have no `isActive`.

**1.9.5 حجز الاستشارة الفردية (Individual consultation booking) — ⚠️ Partial** · *Phase 4 / CC‑1*
Pick doctor+type→slot→checkout, slot‑lock‑on‑pay, text history read‑only after present. Deltas: **no doctor‑change reset**, **no day→times / min‑lead**, **no 2‑upcoming guard**, limited client‑data review, **portal not 30‑min‑before**, **no no‑show/auto‑done** (`missed`/`completed` never written).

**1.9.6 حجز وشراء باقة استشارات (Consultation package) — ❌ Incorrect** · *Phase 4*
Spec: book **all** sessions (type + slot per session, respecting interval) **before** one full payment; confirm on payment. Code: pays first, then schedules **one session at a time after payment** from the account; session type hardcoded `individual-text`; **no interval rule, no 2‑active‑package guard, no no‑show consumption**.

**1.9.7 بوابة تنفيذ الاستشارة (Consultation portal) — ⚠️ Partial** · *Phase 4*
Text portal with time gating and read‑only‑after exists; package sessions get `portalHref`. Deltas: **opens at start, not 30‑min‑before (no prep‑only mode)**; **video is a static external link**, text lacks images/files; **no late‑entry/reconnect/no‑show** handling; no recording (correct).

**1.9.8 صفحة الرحلات (Trips page) — ⚠️ Partial** · *Phase 5 / CC‑3,CC‑5*
Active‑only, search, category filter, capacity/remaining seats, guest browse, general‑prerequisite (detail only) present. Deltas: **no featured section**, **no place filter**, **no currency** (`$` only), cards **missing features list**, **no direct‑purchase action on list**.

**1.9.9 تفاصيل باقة الرحلة (Trip detail) — ⚠️ Partial** · *Phase 5 / CC‑3,CC‑5*
Features as text list, remaining seats, share, favorite, can't‑buy‑twice, off‑platform copy, disabled‑keeps‑past‑purchase present. Deltas: category shown as place label; price `$` only; prerequisite only on detail.

**1.9.10 شراء باقة الرحلة (Trip purchase) — ⚠️ Partial** · *Phase 5 / CC‑1,CC‑3,CC‑5*
Capacity not reserved till pay, sold‑out handling, status `purchased`, no‑rebuy present. Deltas: **no prerequisite re‑check at checkout**, currency via `formatPrice` only, **no admin‑notify**, email/invoice in‑app only, no list direct‑buy.

**1.9.11 الاستشارة الأولية للعيادة (Clinic initial consultation) — ❌ Incorrect** · *Phase 4 / CC‑1*
From clinic detail → consultation booking with `isInitial=true` present. Deltas: **type hardcoded `video`**, **prices hardcoded**, **no min‑days**; **prerequisite requires `completed` which never happens (CC‑1)** so it never unlocks clinic booking; per‑doctor scoping exists but is unreachable.

**1.9.12 الاستشارة الأولية العامة للرحلات (Trip general initial consultation) — ❌ Incorrect** · *Phase 4 / CC‑1*
`/trips/[tripId]/initial-consultation` route exists. Deltas: **specialist hardcoded `dr-sarah`**, **type hardcoded `video`**, same broken `completed` gate (CC‑1), no explicit post‑completion return to originating trip.

### 3.5 Community (1.10 – 1.10.8)

**1.10 صفحة المجتمع (Community hub) — ⚠️ Partial** · *Phase 6 / CC‑2*
Hub lists sections (chat, podcasts, blogs, theories, research, cooperation, monograph) with name/desc/enter; no featured feed; no unified search; lock badges present. Deltas: gating relies on CC‑2; sections hardcoded `isActive: true` (no runtime disable representation).

**1.10.1 المحادثة الجماعية (Group chat) — ❌ Incorrect** · *Phase 6 / CC‑2*
Single subscriber chat, text‑only, expiry→read‑only, guest/never‑sub blocked, no search present. Deltas: **shows messages before subscription start** (service supports a `subscriptionStartDate` filter but UI never passes it; no `subscriptionStartDate` on `User`); **no Arabic "الإدارة" badge**; **no admin mute (send‑ban) or delete representation**.

**1.10.2 البودكاست (Podcast) — ⚠️ Partial** · *Phase 6 / CC‑2*
Latest‑3 + all‑active, audio player **persists across navigation**, public/locked, disabled hidden present. Deltas: locked play uses disabled buttons (no login→subscribe funnel for logged‑in non‑subscriber); extra `authenticated` access level not in spec.

**1.10.3 المقالات (Articles/blogs) — ⚠️ Partial** · *Phase 6 / CC‑7*
Detail content, locked gating on detail, like/comment (login) present. Deltas: **list reads raw `BlogContext`, not `getActiveBlogs()`** → inactive may show, no access badges, "short desc" truncates full content; list like silently no‑ops for guests.

**1.10.4 النظريات (Theories) — ⚠️ Partial** · *Phase 6 / CC‑7*
Same pattern as articles; same gaps (no `getActiveTheories()`, no badges, inactive not filtered on list).

**1.10.5 الأبحاث (Research) — ❌ Incorrect** · *Phase 6 / CC‑7*
Detail gating OK, but the **list blocks the entire section for guests/non‑subscribers** (`researches-page.tsx:21–38`), contradicting "guest can browse public content."

**1.10.6 التعاون والاقتراحات (Cooperation/suggestions) — ⚠️ Partial** · *Phase 6*
Intro+form, login required, admin‑defined types selector, validation, success screen present. Deltas: **disabled type not handled** (no `isActive`); section route is `/community/podcast-request` (misleading naming vs `/community/cooperation`).

**1.10.7 موسوعة النباتات والفطريات (Plants/fungi list) — ⚠️ Partial / ❌ duplicate** · *Phase 6 / CC‑8*
Canonical `/monograph`: subscriber‑only, unified plants+fungi list, search ar/en name, disabled hidden present. Deltas: **filter is type‑only (Plant/Fungi), not a single admin category filter**; **categories missing on card**; CC‑8 duplicate `/encyclopedia` implements a different (4‑filter, ungated) product.

**1.10.8 تفاصيل نبات/فطر (Plant/fungus detail) — ⚠️ Partial** · *Phase 6 / CC‑2*
Subscriber‑only detail, properties/benefits/warnings/family/origin/spread, favorite, plain text, no usage section, no similar list present. Deltas: **scientific/English/Arabic name not rendered**, **no share button** (with non‑sub prompt), **expired‑sub still opens** (CC‑2), disabled‑saved favorite not flagged "unavailable".

### 3.6 Project Additions (1.11 – 1.14)

**1.11 التقييم الصحي (Health assessment) — ⚠️ Partial** · *Phase 7*
Registered‑only, standalone form, skippable, history preserved, re‑takeable present. Deltas: **not shown before first initial consultation** (only prompted on consultation/clinic *detail* after booking); **answer model is Mild/Severe (0/1/2), not none/present/chronic**; sections hardcoded (not admin‑driven); submit does **not notify admin** or set a completion flag.

**1.12 الاشتراكات (Subscriptions) — ⚠️ Partial** · *Phase 6 / CC‑2*
Plans page (guest+user), monthly/yearly, same‑content‑all‑plans, currency change, guest→login, checkout review, activate on success, no auto‑renew, can't‑buy‑while‑active, no refund present. Deltas: **expiry never clears `isSubscribed` (CC‑2)** → expired users keep access and can't be re‑prompted; **no subscription email/confirmation**; account "current plan" card lacks plan name/price/invoice.

**1.13 النشرة الإلكترونية (Newsletter) — ⚠️ Partial** · *Phase 7*
Registered‑only, account/different email, OTP confirm (test `1234`), admin send to confirmed, no archive, unsubscribe from section, resubscribe present. Deltas: **duplicate check is per‑user+email, not global by email**; no explicit duplicate message; format validation HTML5 only.

**1.14 مساعد B3 الذكي (AI assistant) — ⚠️ Partial** · *Phase 7*
Platform‑wide widget, guest+user no‑sub, text‑only, no limit, no links/cards, can't perform actions, session‑only present. Deltas: **knowledge base thin** (courses/books/subscription keywords; missing booking/registration/locked‑content/section inventory); **no explicit out‑of‑scope message** (generic fallback instead); **no health disclaimer**.

### 3.7 Personal Account (1.15 – 1.15.14)

**1.15 الرئيسية للحساب (Account home) — ⚠️ Partial** · *Phase 8*
Reachable from header; nearest appointment, subscription status, section links present. Deltas: **no in‑progress course + progress %**, **no latest‑notifications list**, **no quick‑link grid** in the body.

**1.15.1 البيانات الشخصية (Profile edit) — ⚠️ Partial** · *Phase 2*
Name/phone/email/avatar shown; email change via OTP; cancel keeps old. Deltas: phone is plain text (not country‑code picker like register); **no duplicate‑email check** before OTP.

**1.15.2 تغيير كلمة المرور (Change password) — ⚠️ Partial** · *Phase 2*
Current+new+confirm, verify current, match, success present. Delta: **weaker strength rule (≥6) than register/reset (8+ complexity)**; no strength UI.

**1.15.3 دوراتي وشهاداتي (My courses & certificates) — ⚠️ Partial** · *Phase 3*
Enrolled courses, status, progress, installment paid count, continue link present. Deltas: no locked/unlocked section breakdown, no distinct "revisit completed", **certificate is `.html` not PDF**.

**1.15.4 كتبي (My books) — ⚠️ Partial** · *Phase 5*
Purchased books by format, ebook→reader, no‑rebuy present. Delta: **shipping address not displayed** for print orders.

**1.15.5 حجوزات العيادات (Clinic bookings) — ⚠️ Partial** · *Phase 4 / CC‑4*
List from storage, doctor/clinic/date/time/status/payment present. Deltas: **no upcoming/past split**, **duration not shown**, **no auto "done"**, **detail page broken (CC‑4 storage vs `user`, param mismatch)**.

**1.15.6 استشاراتي وباقاتي (Consultations & packages) — ⚠️ Partial** · *Phase 4*
Individual+packages+sessions list, remaining sessions, status present. Deltas: duration not shown; **portal not 30‑min‑before**; initial‑typing depends on stored `kind`.

**1.15.7 باقات الرحلات (Purchased trips) — ⚠️ Partial** · *Phase 5*
List with date/status/note, no‑rebuy present. Deltas: **missing image, duration, place, features, price, invoice link**.

**1.15.8 اشتراكي (Subscription status) — ⚠️ Partial** · *Phase 6*
History table (plan/dates/amount/status), active→can't buy, expired→buy, manual renewal present. Delta: **current‑plan card lacks plan name, price/currency, start date, invoice**.

**1.15.9 المدفوعات والفواتير (Payments & invoices) — ✅ Effectively complete** · *no work*
All types, invoice only when successful, failed shows retry (`payments-page.tsx`, `account-selectors.service.ts:282–283`). (Invoices are data‑URL not PDF — frontend acceptable.)

**1.15.10 التقييمات الصحية (Health assessments) — ⚠️ Partial** · *Phase 7*
List with date, open past, history preserved, no score present. Delta: **displays Mild/Severe, not none/present/chronic** (tied to 1.11 model fix).

**1.15.11 المفضلة (Favorites) — ⚠️ Partial** · *Phase 8 / CC‑2*
List + remove, unavailable label present. Deltas: **no subscription enforcement** (expired‑sub items still openable), availability checks catalog existence only (ignores metadata status).

**1.15.12 الإشعارات (Notifications) — ⚠️ Partial** · *Phase 8*
Read/unread, open→mark read+navigate, mark‑all‑read, delete‑one present. Deltas: **no bulk delete/multi‑select**, no explicit broken‑link handling.

**1.15.13 إدارة النشرة (Newsletter management) — ✅ Effectively complete** · *no work*
Email+confirm status, delete with confirm, subscribe account/different+confirm, no archive (`newsletter-page.tsx`). (Shares the global‑duplicate gap with 1.13.)

**1.15.14 تسجيل الخروج وحذف الحساب (Logout & delete) — ⚠️ Partial** · *Phase 2*
Logout→visitor, final warning, warns about active services, no refund, blocks deleted login present. Delta: **password is NOT verified against stored credentials** (`deleteAccount` only checks non‑empty) — security defect.

---

## 4. Implementation Phases

Phases are ordered by dependency: **lifecycle/access correctness → auth integrity → learning → care → catalog/library → community/subscription gating → discovery/utilities → account & polish.** Complete Phase 1 before any per‑screen polish, because the cross‑cutting defects (CC‑1…CC‑8) block or distort downstream flows.

Each phase lists Goal, Business Requirements Covered, Screens Affected, Components Affected, User Flows Affected, Implementation Tasks, and the **per‑gap detail** for every gap it closes.

---

### Phase 1 — Critical Lifecycle & Access Continuity

#### Goal
Repair the cross‑cutting defects that silently break end‑to‑end journeys: the consultation completion lifecycle (which gates clinic & trip purchases), subscription‑expiry enforcement (which gates all locked content), prerequisite re‑checks, and the booking detail data‑source split. Nothing downstream can be correctly demonstrated until these are fixed.

#### Business Requirements Covered
1.9.3, 1.9.5, 1.9.7, 1.9.10, 1.9.11, 1.9.12 (prerequisite/lifecycle aspects), 1.12, 1.10 / 1.10.1 / 1.10.2 / 1.10.7 / 1.10.8 (subscription‑expiry aspects), 1.15.5 (booking detail), 1.15.11 (favorites expiry).

#### Screens Affected
`/clinic/[clinicId]`, `/clinic/[clinicId]/book`, `/clinic-booking/[bookingId]`, `/consultations/[doctorId]/book`, `/consultation/[consultationId]` + `/chat`, `/trips/[tripId]`, `/trips/[tripId]/initial-consultation`, `/checkout/*`, all community detail pages, `/monograph` + detail, `/dashboard/favorites`, `/dashboard/subscription`.

#### Components Affected
`consultation-detail.tsx`, `chat-consultation.tsx`, `clinic-booking-detail.tsx`, `clinic-detail-page.tsx`, `trip-detail-page.tsx`, `checkout-page.tsx`, `auth-action-gate.tsx`, `owned-content-gate.tsx`, community `*-detail-page.tsx`, `monograph-detail.tsx`, `favorites-page.tsx`.

#### Services Affected
`care-prerequisite.service.ts`, `care-records-storage.service.ts`, `portal-eligibility.service.ts`, `access-policy.service.ts`, `auth-provider.tsx`, `subscription-history.service.ts`, `account-selectors.service.ts`.

#### User Flows Affected
Book initial consultation → attend → unlock clinic appointment; book initial consultation → attend → unlock all trips; subscribe → access locked content → expire → lose access → renew; view a real clinic booking detail.

#### Implementation Tasks
1. Add a deterministic **consultation completion transition** (frontend): a `markConsultationCompleted(id)` path plus a time‑based derivation so that once a consultation's `endTime` passes, `getStoredConsultationById` resolves `status: 'completed'` (and `missed` if never entered). Expose it through `portal-eligibility`/selectors so account and prerequisite checks agree.
2. Make `evaluateClinicInitialConsultation`/`evaluateTripInitialConsultation` driven by the derived `completed` status; ensure once‑per‑doctor (clinic) and once‑for‑all‑trips (general) semantics.
3. Add a single **subscription‑validity helper** `isSubscriptionActive(user, now)` that checks `subscriptionExpiryDate`; replace every raw `user.isSubscribed` gate (`community-content.service.ts`, `monograph.service.ts`, podcast, favorites) with it. Clear/treat‑as‑expired when the date passes.
4. Re‑check prerequisites on the `/book` routes **and** in `checkout-page.tsx` (not only on detail pages) so direct‑URL bypass is impossible.
5. Fix the clinic booking detail: read from `care-records-storage` (`selectAccountClinicBookings`/`getStoredClinicBookingById`) and fix the route param (`useParams<{ bookingId }>`).
6. Enforce favorites subscription state: items needing a subscription become non‑openable (with "renew to open") when the subscription is inactive; disabled catalog items show "غير متاح".

#### Gaps closed

**GAP‑1.1 — Consultation completion lifecycle missing (CC‑1)**
- **Business Requirement:** Initial consultations satisfy clinic/trip prerequisites **only after the consultation actually ends** (1.9.11, 1.9.12); individual/package consultations auto‑transition to "تمت الاستشارة" after their time (1.9.5, 1.9.7).
- **Current State:** No code path sets `status: 'completed'`; prerequisite check requires it (`care-prerequisite.service.ts:46–48`); records stay `scheduled` after payment.
- **Gap Analysis:** Clinic booking (1.9.3) and trip purchase (1.9.10) are permanently blocked for any honest flow; account statuses never progress.
- **Required Changes:** Implement time‑derived + explicit completion (task 1–2); wire prerequisites and account selectors to it.
- **Priority:** Critical · **Complexity:** Medium

**GAP‑1.2 — Subscription expiry not enforced (CC‑2)**
- **Business Requirement:** On expiry the customer loses locked‑content access while keeping public content and past chat read access (1.12, 1.10.x).
- **Current State:** Gating uses `Boolean(user?.isSubscribed)` without date check; only group chat honors expiry.
- **Gap Analysis:** Expired users keep access; renewal prompts never appear; favorites/monograph/podcast gating wrong.
- **Required Changes:** Central `isSubscriptionActive` helper applied everywhere (task 3).
- **Priority:** Critical · **Complexity:** Medium

**GAP‑1.3 — Prerequisite enforced only on detail pages (CC‑3)**
- **Business Requirement:** Clinic appointment / trip purchase must verify the initial consultation before allowing booking/checkout (1.9.1, 1.9.3, 1.9.8, 1.9.10).
- **Current State:** Only detail pages check; `/book` and `checkout-page.tsx` do not.
- **Gap Analysis:** Direct URL bypasses the prerequisite.
- **Required Changes:** Re‑check on `/book` routes and checkout (task 4).
- **Priority:** Critical · **Complexity:** Small

**GAP‑1.4 — Clinic booking detail data‑source split (CC‑4)**
- **Business Requirement:** Customer can open a confirmed clinic booking and see its data (1.15.5, 1.9.3).
- **Current State:** Detail reads `user.clinicBookings`; checkout writes to storage; route param `[bookingId]` vs component `id`.
- **Gap Analysis:** Real bookings don't render.
- **Required Changes:** Read from storage; fix param (task 5).
- **Priority:** High · **Complexity:** Small

**GAP‑1.5 — Favorites ignore subscription/availability (part of CC‑2)**
- **Business Requirement:** A subscription‑gated favorite stays saved but is not openable when the subscription is inactive; disabled items show "unavailable" (1.15.11, 1.10.8).
- **Current State:** Open link enabled whenever the catalog item exists; no subscription/metadata check.
- **Gap Analysis:** Expired users open gated content via favorites.
- **Required Changes:** Apply `isSubscriptionActive` + metadata status in `favorites-page.tsx` (task 6).
- **Priority:** High · **Complexity:** Small

---

### Phase 2 — Authentication, Registration & Account Security Integrity

#### Goal
Close correctness/security gaps in the auth and account‑security surfaces so registration, profile edits, password change and account deletion behave exactly as specified.

#### Business Requirements Covered
1.6, 1.15.1, 1.15.2, 1.15.14.

#### Screens Affected
`/auth`, `/dashboard/profile`, `/dashboard/password`, `/dashboard/security`.

#### Components Affected
`auth-page.tsx`, `profile-page.tsx`, `password-page.tsx`, `security-page.tsx`.

#### Services Affected
`auth-provider.tsx`, `auth-storage.service.ts`.

#### User Flows Affected
Register with OTP (incl. resend); change email with OTP + uniqueness; change password with full strength rules; delete account with verified password.

#### Implementation Tasks
1. Add a **resend‑OTP** control (with cooldown) to the register verify modal and reuse it for profile email and reset flows.
2. In profile email change, call `findAccountByEmail` to reject an email already used by another account **before** sending OTP; add explicit invalid‑format messaging.
3. Replace `PhoneInput`‑equivalent country‑code picker in profile (parity with register) instead of plain text.
4. Unify password strength rules: password page must enforce the same 8+/complexity rule as register/reset, with inline strength feedback.
5. Make `deleteAccount` **verify the entered password** against stored credentials (reuse `changeStoredPassword`/credential check) before deletion.

#### Gaps closed

**GAP‑2.1 — No resend OTP (1.6)** · Current: verify modal lacks resend. Required: resend with cooldown. · **High · Small**

**GAP‑2.2 — Profile email lacks uniqueness/format check (1.15.1)** · Current: OTP sent without `findAccountByEmail`. Required: reject duplicate + invalid format pre‑OTP; add country‑code picker. · **High · Small**

**GAP‑2.3 — Password page weaker than spec (1.15.2)** · Current: `length>=6`, no strength UI. Required: 8+/complexity parity + feedback. · **Medium · Small**

**GAP‑2.4 — Delete account does not verify password (1.15.14)** · Current: only non‑empty check. Required: verify against stored account; keep existing final‑warning + active‑services warning. · **High · Small**

---

### Phase 3 — Course Experience & Learning Journey

#### Goal
Bring the paid course funnel and learning experience to spec: sequential progression, correct catalog filters, installment UX, post‑purchase continuity, and PDF certificates.

#### Business Requirements Covered
1.8, 1.8.1, 1.8.2, 1.8.3, 1.8.4, 1.8.5, 1.8.6, 1.15.3.

#### Screens Affected
`/education`, `/courses`, `/courses/[courseId]`, `/checkout/course/[id]`, `/learn/[courseId]`, `/dashboard/courses`.

#### Components Affected
`course-catalog.tsx`, `course-detail-page.tsx`, `checkout-page.tsx`, `course-player.tsx`, `quiz-player.tsx`, `courses-page.tsx` (account), `education-page.tsx`.

#### Services Affected
`courses.service.ts`, `enrollment.service.ts`, `course-progress.service.ts`, `quiz-attempt.service.ts`, `certificate.service.ts`.

#### User Flows Affected
Browse/filter courses → detail → enroll/pay (full or installment) → land in content → progress sequentially → quizzes → final exam → completion → certificate download.

#### Implementation Tasks
1. **Enforce forced sequential lesson order** in `isLessonAccessible`: a lesson/section is accessible only when all prior lessons are complete (in addition to installment entitlement); show "complete the previous part first" when blocked.
2. Add a **currency filter control** to `course-catalog.tsx` (or bind the global `CurrencyContext` selector visibly) and apply price filters in the selected currency; change the duration filter to operate in **hours** (label and bounds) per the card.
3. Gate the installment UI in checkout to courses whose `supportsPaymentMode` includes installments; hide it for full‑only.
4. Add an inline **"pay next section"** action in the player for installment courses when the next in‑order section is unpaid.
5. On successful course payment, **redirect into `/learn/[courseId]`** (course content), not `/dashboard/payments`.
6. Generate the certificate as a **PDF** (client‑side, e.g. print‑to‑PDF/jsPDF) preserving template + user name/course/date/unique number; update account download to `.pdf` (1.15.3).
7. Localize category badge/level on catalog cards; remove the out‑of‑spec level filter (or keep behind the documented decision); make `c2`'s attempt cap configurable so "unlimited" is the default.
8. Use distinct summary vs detailed description fields on the course detail page if available; ensure guest pending‑intent returns to the **course**, then continues to checkout.

#### Gaps closed

**GAP‑3.1 — Sequential lesson order not enforced (1.8.4)** · Current: only installment entitlement gates access. Required: prior‑lesson completion required (task 1). · **High · Medium**

**GAP‑3.2 — Catalog currency filter missing; duration in minutes (1.8.1)** · Required: currency filter + hours (task 2). · **Medium · Small**

**GAP‑3.3 — Installment UI shown for full‑only courses (1.8.3)** · Required: gate by `supportsPaymentMode` (task 3). · **Medium · Small**

**GAP‑3.4 — No inline pay‑next‑section in player (1.8.4)** · Required: add inline pay action (task 4). · **Medium · Medium**

**GAP‑3.5 — Post‑purchase doesn't enter course content (1.8.3)** · Required: redirect to `/learn` (task 5). · **High · Small**

**GAP‑3.6 — Certificate is HTML not PDF (1.8.6, 1.15.3)** · Required: PDF generation + account `.pdf` download (task 6). · **Medium · Medium**

**GAP‑3.7 — Catalog card localization & out‑of‑spec filters (1.8.1)** · Required: localize badges/level; default unlimited quiz attempts (tasks 7). · **Low · Small**

**GAP‑3.8 — Detail summary/detailed description & guest return target (1.8.2)** · Required: distinct fields + return‑to‑course intent (task 8). · **Low · Small**

---

### Phase 4 — Clinic & Consultation Experience

#### Goal
Rebuild the consultation/clinic booking journeys to match the spec: per‑doctor admin‑configured types/prices/slots, day→times selection with min‑lead, doctor/clinic switching with auto‑pairing, package "book‑all‑sessions‑upfront", a real 30‑minute‑before portal with video/text, no‑show/auto‑done statuses, the clinics general‑services section, and correct initial‑consultation type selection.

#### Business Requirements Covered
1.9.1, 1.9.2, 1.9.3, 1.9.4, 1.9.5, 1.9.6, 1.9.7, 1.9.11, 1.9.12, 1.15.5, 1.15.6. (Lifecycle aspects depend on Phase 1.)

#### Screens Affected
`/clinic`, `/clinic/[clinicId]`, `/clinic/[clinicId]/book`, `/consultations`, `/consultations/[doctorId]/book`, `/trips/[tripId]/initial-consultation`, `/consultation/[consultationId]` + `/chat`, `/dashboard/clinic-bookings`, `/dashboard/consultations`.

#### Components Affected
`clinic-page.tsx` (under `(site)/clinic`), `clinic-detail-page.tsx`, `booking-slot-selector.tsx`, `booking-flow.tsx`, `consultation-detail.tsx`, `chat-consultation.tsx`, `clinic-bookings-page.tsx`, `consultations-page.tsx`, the initial‑consultation page.

#### Services Affected
`care-data.service.ts`, `care-records-storage.service.ts`, `slot-repository.service.ts`, `booking-slots.service.ts`, `portal-eligibility.service.ts`, `care-prerequisite.service.ts`.

#### User Flows Affected
Browse clinics → (direct or detail) book → prerequisite → choose day/time → review (editable data + notes) → pay → confirmed → attend via portal → auto‑done. Individual consultation booking; package multi‑session booking‑before‑payment; both initial‑consultation flows with type selection.

#### Implementation Tasks
1. **Slot model:** replace static mock slots with an admin‑style config (frontend mock) per doctor/clinic: fixed duration, working days/hours, min‑days lead. Selection UI: pick **day → available times for that day only**; "no times" state.
2. **Clinic booking:** add doctor/clinic switcher with auto‑pairing (change clinic→change doctor); add editable account data + optional notes step; add 2‑active‑booking guard; derive auto "done" after appointment time (with Phase‑1 lifecycle).
3. **Clinics page:** render the **general grouped‑services section** (name/desc/image each); show category tabs only when categories exist; add a **direct‑booking action** at the top.
4. **Clinic detail:** allow existing‑booking holders to still reach a disabled clinic's record (read‑only) while blocking new bookings.
5. **Consultations page:** drive consultation **types/prices/durations per doctor from config** (not hardcoded); show linked clinic; show previously booked/purchased state; respect doctor `isActive`.
6. **Individual booking:** doctor‑change resets type/slot; min‑lead; 2‑upcoming guard; full review (doctor, type, date, time, duration, price, currency, client data).
7. **Package booking (rework, 1.9.6):** select package → choose **type + slot for every session before payment**, enforcing the admin interval; one full payment confirms all sessions; 2‑active‑package guard; show total/done/remaining/upcoming/type/status; no‑show consumes a session.
8. **Consultation portal (1.9.7):** open **30 minutes before** in prep‑only mode (no interaction); enable video (no recording) or text at start time; text supports images/files; handle late entry (remaining time only), reconnect, and end‑of‑time stop; text history read‑only after.
9. **Initial consultations (1.9.11/1.9.12):** add **type selection (video/text)**; per‑doctor admin price/duration/slots; clinic flow auto‑pairs doctor/clinic; trip flow lists **admin specialists** (not hardcoded) and returns to the originating trip after completion (which now happens via Phase 1).
10. Apply `CurrencyContext` to all care prices (CC‑5).

#### Gaps closed

**GAP‑4.1 — Static slots; no admin duration/days/min‑lead; no day→times (1.9.3, 1.9.5)** · Required: slot config + day→times UI (task 1). · **High · Large**

**GAP‑4.2 — No doctor/clinic switcher, editable data+notes, 2‑active guard, auto‑done (1.9.3)** · Required: tasks 2. · **High · Medium**

**GAP‑4.3 — Clinics page missing general services & direct booking; always‑on category tabs (1.9.1)** · Required: task 3. · **Medium · Medium**

**GAP‑4.4 — Disabled clinic not accessible to existing bookings (1.9.2)** · Required: task 4. · **Medium · Small**

**GAP‑4.5 — Consultation types/prices hardcoded; no linked clinic/booked state (1.9.4)** · Required: task 5. · **High · Medium**

**GAP‑4.6 — Individual booking missing reset/min‑lead/guard/full review (1.9.5)** · Required: task 6. · **High · Medium**

**GAP‑4.7 — Package model is pay‑first/schedule‑later (1.9.6, ❌ Incorrect)** · Required: book‑all‑sessions‑before‑payment rework (task 7). · **Critical · Large**

**GAP‑4.8 — Portal lacks 30‑min prep & rich text; no late/reconnect/no‑show (1.9.7)** · Required: task 8. · **High · Large**

**GAP‑4.9 — Initial consultations hardcode type/specialist/price (1.9.11, 1.9.12, ❌ Incorrect)** · Required: task 9 (unlock via Phase 1). · **High · Medium**

**GAP‑4.10 — Care prices ignore currency (CC‑5)** · Required: task 10. · **Medium · Medium**

**GAP‑4.11 — Account clinic/consultation lists missing duration/upcoming‑past/portal timing (1.15.5, 1.15.6)** · Required: show duration; upcoming/past split; align portal timing with task 8. · **Medium · Small**

---

### Phase 5 — Trips, Book Library & Educational Content

#### Goal
Complete the trips funnel, the books catalog/purchase/reader, and the education encyclopedia detail.

#### Business Requirements Covered
1.8.7, 1.8.8, 1.8.9, 1.8.10, 1.8.11, 1.8.12, 1.9.8, 1.9.9, 1.9.10, 1.15.4, 1.15.7.

#### Screens Affected
`/trips`, `/trips/[tripId]`, `/checkout/trip/[id]`, `/books`, `/books/[bookId]`, `/checkout/book/[id]/[format]`, `/read/[bookId]`, `/encyclopedia`, `/encyclopedia/[entryId]`, `/dashboard/books`, `/dashboard/trips`.

#### Components Affected
`trips-page.tsx`, `trip-detail-page.tsx`, `book-catalog.tsx`, `book-detail-page.tsx`, `book-reader.tsx`, `checkout-page.tsx`, `encyclopedia-list.tsx`, `encyclopedia-detail.tsx`, `books-page.tsx` (account), `trips-page.tsx` (account).

#### Services Affected
`care-data.service.ts`, `trip-capacity.service.ts`, `books.service.ts`, `book-purchase.service.ts`, `book-content.service.ts`, `encyclopedia.service.ts`.

#### User Flows Affected
Browse/filter trips → detail → prerequisite (Phase 1) → purchase (currency, invoice, admin‑notify) → account record. Browse/filter books → detail → choose version → purchase (shipping for print) → read ebook. Encyclopedia browse → item detail.

#### Implementation Tasks
1. **Trips page:** add featured section; add place filter; bind currency to prices and the price filter; add card features list; add direct‑purchase action on the list.
2. **Trip detail/purchase:** show category distinctly; currency on detail and checkout; record an **admin‑notify** marker on purchase; downloadable invoice.
3. **Account purchased trips:** show image, duration, place, features, price/currency, purchase date, status, invoice (1.15.7).
4. **Books list:** add short desc, category badge, **version‑type badges** to cards; add currency filter and **version‑type filter**; convert price filter to selected currency; category tabs from admin categories.
5. **Book purchase:** add inline **shipping address create/edit** + saved‑address selection; create a distinct print‑order record flagged for admin fulfillment; currency on checkout.
6. **Account my books:** display shipping address/order data for print purchases (1.15.4).
7. **Encyclopedia detail:** show **publish date** for articles; render the **4th category dimension (`herbType`)** for herbs; add search to the news/articles section in the list (1.8.11/1.8.12).
8. Resolve CC‑8 mapping decision in code comments/routing (education `/encyclopedia` = 1.8.11/1.8.12; community `/monograph` = 1.10.7/1.10.8 handled in Phase 6).

#### Gaps closed

**GAP‑5.1 — Trips page missing featured/place filter/currency/features/direct buy (1.9.8)** · task 1 · **Medium · Medium**

**GAP‑5.2 — Trip detail/purchase currency, invoice, admin‑notify (1.9.9, 1.9.10)** · task 2 · **Medium · Small**

**GAP‑5.3 — Account purchased trips missing fields (1.15.7)** · task 3 · **Medium · Small**

**GAP‑5.4 — Books list missing card fields & currency/version filters (1.8.7)** · task 4 · **High · Medium**

**GAP‑5.5 — Book purchase lacks address CRUD & print‑order record (1.8.9)** · task 5 · **High · Medium**

**GAP‑5.6 — Account my books missing shipping data (1.15.4)** · task 6 · **Low · Small**

**GAP‑5.7 — Encyclopedia detail missing date/herbType; news has no search (1.8.11, 1.8.12)** · task 7 · **Medium · Small**

**GAP‑5.8 — Ebook reader screenshot prevention (1.8.10)** · Document as browser limitation; keep best‑effort deterrents. · **Low · Small**

---

### Phase 6 — Community Content & Subscription Gating

#### Goal
Align community content listing/gating with the spec, fix the group‑chat subscription window and moderation representation, correct the research list, unify the plants/fungi encyclopedia, and complete subscription account details. (Expiry enforcement comes from Phase 1.)

#### Business Requirements Covered
1.10, 1.10.1, 1.10.2, 1.10.3, 1.10.4, 1.10.5, 1.10.6, 1.10.7, 1.10.8, 1.12, 1.15.8.

#### Screens Affected
`/community`, `/community/blogs` + detail, `/community/researches` + detail, `/community/theories` + detail, `/community/chat`, `/community/cooperation`, `/podcasts`, `/monograph` + detail, `/subscriptions`, `/dashboard/subscription`.

#### Components Affected
`community-home-page.tsx`, blog/research/theory list + detail pages, `community-chat.tsx`, `podcast-request-form.tsx`, `podcast-library.tsx`, `monograph-list.tsx`, `monograph-detail.tsx`, `subscriptions-page.tsx`, `subscription-page.tsx` (account).

#### Services Affected
`community-content.service.ts`, `community-chat-storage.service.ts`, `community-sections.service.ts`, `cooperation-request.service.ts`, `podcasts.service.ts`, `monograph.service.ts`, `subscriptions.service.ts`, `subscription-history.service.ts`.

#### User Flows Affected
Browse community public vs locked → subscribe → access; group chat read/send with subscription window + moderation; like/comment; submit cooperation request; subscriber plants/fungi browse + detail + favorite; subscription purchase + account view.

#### Implementation Tasks
1. **Lists use active+access:** blog/theory/research lists call `getActiveBlogs/Theories/Researches()` and render access badges; remove the dual context path or sync it so inactive items never list (CC‑7).
2. **Research list:** allow guests/non‑subscribers to browse public items (remove whole‑section block); gate only locked items (1.10.5).
3. **Group chat:** add `subscriptionStartDate` to `User`; pass it so only messages from subscription start show; render Arabic "الإدارة" badge for admin messages; represent admin **mute (send‑disabled)** and **deleted** messages on the frontend (driven by flags/mock) (1.10.1).
4. **Podcast:** for logged‑in non‑subscribers attempting a locked episode, route to `/subscriptions` (full login→subscribe funnel); keep public playable (1.10.2).
5. **Cooperation:** honor `isActive` on request types (hide disabled); align route naming to `/community/cooperation` (1.10.6).
6. **Monograph (plants/fungi):** replace the type‑only filter with a **single admin category filter**; show categories on the card; render Arabic/common name, English name, and **scientific name** on detail; add a **share button** that prompts non‑subscribers to subscribe; ensure expired‑sub keeps favorite saved but blocks open (Phase 1) and disabled‑saved shows "غير متاح" (1.10.7, 1.10.8).
7. **Subscriptions:** add subscription **email/confirmation** representation on success; complete the account current‑plan card (plan name, price/currency, start/end, status, invoice) (1.12, 1.15.8).

#### Gaps closed

**GAP‑6.1 — Lists ignore active/access metadata (1.10.3, 1.10.4; CC‑7)** · task 1 · **Medium · Medium**

**GAP‑6.2 — Research list blocks public browse (1.10.5, ❌ Incorrect)** · task 2 · **High · Small**

**GAP‑6.3 — Group chat: pre‑subscription messages, no admin badge/moderation (1.10.1, ❌ Incorrect)** · task 3 · **High · Medium**

**GAP‑6.4 — Podcast locked‑play funnel incomplete (1.10.2)** · task 4 · **Medium · Small**

**GAP‑6.5 — Cooperation disabled types & route naming (1.10.6)** · task 5 · **Low · Small**

**GAP‑6.6 — Monograph filter model, card categories, names, share, favorite state (1.10.7, 1.10.8; CC‑8)** · task 6 · **High · Medium**

**GAP‑6.7 — Subscription email + account current‑plan detail (1.12, 1.15.8)** · task 7 · **Medium · Small**

---

### Phase 7 — Search, Newsletter, AI Assistant & Health Assessment

#### Goal
Complete discovery and the project‑addition utilities to spec.

#### Business Requirements Covered
1.7, 1.11, 1.13, 1.14, 1.15.10.

#### Screens Affected
`/search`, footer newsletter + `/dashboard/newsletter`, the global AI widget, `/health-assessment`, `/dashboard/health-assessments`, and the first‑initial‑consultation entry points (clinic/trips).

#### Components Affected
`search-page.tsx`, `site-layout.tsx` (footer newsletter), `AIChatWidget.tsx`, `health-assessment-page.tsx`, `health-assessments-page.tsx`.

#### Services Affected
`search-index.service.ts`, `newsletter-storage.service.ts`, `assistant-config.service.ts`, `account-records.service.ts`.

#### User Flows Affected
Site‑wide search (incl. FAQ/subscriptions/monographs) → grouped results → detail; newsletter subscribe with global duplicate check; AI assistant scope + disclaimer; optional health assessment before first initial consultation, re‑take, history.

#### Implementation Tasks
1. **Search:** index FAQ, subscription plans, and monographs; complete `kindLabels` for every result kind; keep text‑only, grouped, empty‑state (1.7).
2. **Newsletter:** add a **global duplicate‑by‑email** check with an explicit "already subscribed" message; add custom invalid‑email messaging; keep OTP confirm + unsubscribe + resubscribe (1.13).
3. **AI assistant:** expand the keyword knowledge base (sections inventory, registration, subscription, booking/purchase steps, locked‑content rules); add an explicit **out‑of‑scope** reply for unknown/general questions; add a **health disclaimer** branch (1.14).
4. **Health assessment:** change the answer model to **none / present / chronic** (default none); present the form **optionally before the first initial consultation** (clinic or trips) with skip; drive sections from frontend admin‑style config; on submit set a completion marker and an admin‑notify marker; keep history (1.11, 1.15.10).

#### Gaps closed

**GAP‑7.1 — Search omits FAQ/subscriptions/monographs; incomplete labels (1.7)** · task 1 · **Medium · Small**

**GAP‑7.2 — Newsletter global duplicate + invalid message (1.13)** · task 2 · **Medium · Small**

**GAP‑7.3 — AI scope guardrail + health disclaimer + KB (1.14)** · task 3 · **Medium · Medium**

**GAP‑7.4 — Health assessment model + pre‑consultation placement (1.11, 1.15.10)** · task 4 · **High · Medium**

---

### Phase 8 — Account Center, Home & UX Consistency Polish

#### Goal
Finish the account home summaries, notifications, and remaining homepage/footer/visitor consistency items.

#### Business Requirements Covered
1.1, 1.2, 1.4, 1.5, 1.15, 1.15.12.

#### Screens Affected
`/`, footer (all pages), `/dashboard`, `/dashboard/notifications`.

#### Components Affected
`home-page.tsx`, `site-layout.tsx`, `dashboard-page.tsx`, `notifications-page.tsx`, `account-shell.tsx`.

#### Services Affected
`account-selectors.service.ts`, `account-records.service.ts`, `site-configuration.service.ts`.

#### User Flows Affected
Account home overview; notifications management; homepage CTAs; footer navigation; consistent guest browse‑vs‑act messaging.

#### Implementation Tasks
1. **Account home:** add the in‑progress course + progress % widget, a latest‑notifications preview list, and a quick‑link grid to all account sections; keep real‑data empty states (1.15).
2. **Notifications:** add bulk delete/multi‑select and explicit broken‑link handling (show content without navigating) (1.15.12).
3. **Homepage:** replace the timed newsletter popup with a non‑intrusive inline section (honor "no advertising banners"); point subscription CTAs to `/subscriptions` (1.2).
4. **Footer:** add `/education` and care "overview" links; add custom invalid‑email messaging on the newsletter field (1.4).
5. **Visitor consistency:** ensure community gating shows subscription messaging (not login) when subscription is the true gate; uniform browse‑vs‑act copy (1.1, 1.5).

#### Gaps closed

**GAP‑8.1 — Account home missing course progress, notifications list, quick links (1.15)** · task 1 · **Medium · Medium**

**GAP‑8.2 — Notifications bulk delete & broken‑link handling (1.15.12)** · task 2 · **Low · Small**

**GAP‑8.3 — Homepage popup vs "no banners"; subscription CTA target (1.2)** · task 3 · **Medium · Small**

**GAP‑8.4 — Footer overview links & invalid‑email message (1.4)** · task 4 · **Low · Small**

**GAP‑8.5 — Visitor/guest messaging consistency (1.1, 1.5)** · task 5 · **Low · Small**

---

## 5. Validation of Previous Gap Documents

The repository contains four prior analysis files. They were re‑validated against the **current** tree. Headline: the codebase has advanced substantially since the gap plans were written (2026‑06‑21), so **most of their original "missing" findings are now Outdated/resolved**; a smaller set of structural findings remains Valid or Incomplete and is carried into the phases above.

### 5.1 `UI_BUSINESS_GAP_PLAN.md`

| Finding (summarized) | Verdict | Note / where it lands |
| -------------------- | ------- | --------------------- |
| Features were thin legacy re‑exports | Incomplete | Mostly feature‑owned now; blog/theory/research still use root contexts → CC‑7 / Phase 6 |
| `npm run build` passes | Valid | Baseline still reasonable |
| Access foundation (pending‑intent, gates) added | Outdated (resolved) | Exists & expanded |
| Payment intent lifecycle + checkout review | Outdated (resolved) | Implemented in `checkout-page.tsx` |
| Subscription via checkout | Outdated (resolved) | `/checkout/subscription/[planId]` + history |
| Newsletter service‑backed | Outdated (resolved) | Service exists; guest flow nuance → Phase 7/8 |
| Community chat persisted | Outdated (resolved) | `community-chat-storage.service.ts` |
| Care records (consultations/trips/clinic) | Outdated (resolved) | `care-records-storage.service.ts` + checkout |
| Certificate records + account download | Outdated (resolved); Incomplete on format | Still HTML, not PDF → GAP‑3.6 |
| Profile/password/delete/favorites service‑backed | Outdated; Incomplete on credential verify | → Phase 2 (GAP‑2.4) |
| Podcast persistent player | Outdated (resolved) | `podcast-player-provider.tsx` |
| Monograph detail normalized | Outdated (resolved) | But filter/name/share gaps remain → GAP‑6.6 |
| Course progress deterministic | Outdated (resolved) | `course-progress.service.ts` |
| Browser `alert()` removed from purchase paths | Outdated (resolved) | None in source |
| Cooperation/suggestions form | Outdated (resolved) | Route naming/disabled types → GAP‑6.5 |
| Navigation shell feature‑owned | Outdated (resolved) | `site-layout.tsx` |
| Public routes (education, search, subscriptions, ratings, terms, community, clinic detail) | Outdated (resolved) | All exist |
| Account subsection routes (14) | Outdated (resolved) | All exist |
| Typed business contracts | Outdated (resolved) | Extended with `status.types`, repositories |
| Payments still local/mock (no gateway/refund/email) | Valid | By design — out of scope |
| Auth mock; return‑to‑action incomplete everywhere | Incomplete | Intents broadened; protected‑route UX coarse → Phase 2 |
| Access policy rollout incomplete | Incomplete | Gates not universal → Phase 1/6 |
| Course player quiz/installment/progress incomplete | Incomplete | Improved; sequential order missing → GAP‑3.1 |
| Book reader secure delivery/export prevention | Incomplete | Best‑effort only → GAP‑5.8 (browser limitation) |
| Clinic booking slot reservation/payment failure | Outdated (resolved) | Slot re‑check in checkout |
| Consultation booking slot/package execution | Incomplete | No completion path → GAP‑1.1; package rework → GAP‑4.7 |
| Trip purchase checkout/seat re‑check | Outdated (resolved) | `decrementTripSeats` + sold‑out |
| Subscription lifecycle/expiry enforcement | Incomplete (Valid core) | → GAP‑1.2 (CC‑2) |
| Community content access rewrite needed | Incomplete | Dual stack → CC‑7 / Phase 6 |
| Encyclopedia alignment incomplete | Incomplete | Filters wired; detail gaps → GAP‑5.7 / GAP‑6.6 |
| AI guardrail verification | Incomplete (Valid core) | Scope/disclaimer missing → GAP‑7.3 |
| Feature ownership cleanup (root contexts) | Incomplete | `CourseCommentContext`, blog contexts remain |
| §5.1 No central access policy | Outdated (resolved) | `access-policy.service.ts` exists |
| §5.1 Deleted‑account state missing | Valid | Re‑register same email still works → note in Phase 2 |
| §5.3 `isActive`/`isFeatured` not applied / UI invents featured | Incomplete | Helpers used, but mock seeds by index → CC‑6 |
| §6.2 Subscription CTAs wrong (→ register) | Valid | → GAP‑8.3 |
| §6.2 Education CTA should be `/education` | Outdated (resolved) | Fixed |
| §6.3 Header IA incomplete | Outdated (resolved) | Search/subscriptions/ratings present |
| §6.4 Terms link missing | Outdated (resolved) | `/terms` exists |
| §6.4 Footer newsletter rules incomplete | Incomplete | → GAP‑8.4 / Phase 7 |
| §6.5 OTP/password mock; no real validation | Valid (mock by design) | Strength parity/verify → Phase 2 |
| §6.6 Global search missing | Outdated (resolved) | `/search` exists |
| §6.6 Search omits FAQ/subscriptions | Valid | → GAP‑7.1 |
| §6.8 Course filters incomplete (currency/duration/tabs) | Incomplete | → GAP‑3.2 |
| §6.10 Certificate PDF missing | Valid | → GAP‑3.6 |
| §6.11 Reader allows download | Outdated (resolved) | Platform‑only reader |
| §6.11 Shipping address flow incomplete | Incomplete | → GAP‑5.5 |
| Care: initial consultation missing | Incomplete (Valid core) | Bookable but never completes → GAP‑1.1 / GAP‑4.9 |

### 5.2 `UI_BUSINESS_MISSING_GAPS_PLAN.md`

| Finding (summarized) | Verdict | Note / where it lands |
| -------------------- | ------- | --------------------- |
| G0.1 Mock/localStorage instead of typed domain layer | Incomplete | Repositories added; persistence still localStorage (by design) |
| G0.1 Missing shared status enums | Outdated (resolved) | `status.types.ts` |
| G0.2 `alert()` in checkout/player/auth | Outdated (resolved) | Replaced with inline messages |
| G0.3 Featured via `.slice()` | Outdated (resolved); Incomplete | `getFeatured*` exists; mock seeds by index → CC‑6 |
| G0.4 Price filters ignore currency; trips/consultations hardcode `$` | Valid/Incomplete | → CC‑5 / GAP‑3.2 / GAP‑4.10 / GAP‑5.1 |
| 1.1 Inconsistent protected‑page behavior | Incomplete | `AccessDeniedState` partial → Phase 1/8 |
| 1.1 Pending intent missing metadata | Outdated (resolved) | Rich `PendingIntent` |
| 1.1 Demo auth defaults/hints | Outdated (resolved) | Not present |
| 1.2 Education CTA wrong | Outdated (resolved) | Fixed |
| 1.2 Featured books not admin‑selected | Incomplete | → CC‑6 |
| 1.2 Testimonials hardcoded | Outdated (resolved) | `getApprovedTestimonials()` |
| 1.2 Home subscription CTAs → register | Valid | → GAP‑8.3 |
| 1.2 Home newsletter popup bypasses service | Outdated (resolved); popup vs banner | → GAP‑8.3 |
| 1.3 Mobile menu lacks submenu links | Incomplete | Verify mobile parity (1.3 note) |
| 1.4 Footer missing subsection links | Outdated (resolved); overview links → GAP‑8.4 | |
| 1.4 Footer newsletter requires auth | Valid | → Phase 7/8 |
| 1.5 Inconsistent visitor blocking | Incomplete | → Phase 1/8 |
| 1.5 Monograph `<Navigate />` without context | Outdated (resolved) | `AccessDeniedState` |
| 1.6 Simulated OTP/reset | Valid (mock) | Resend → GAP‑2.1 |
| 1.6 Demo credentials | Outdated (resolved) | Removed |
| 1.7 Search index incomplete | Incomplete | → GAP‑7.1 |
| 1.7 No access badges on results | Incomplete | → Phase 7 |
| 1.8.1 Featured via first three; category select not tabs; instructor on cards | Outdated/Incomplete | Featured fixed; tabs exist; localization → GAP‑3.7 |
| 1.8.3 Installments always shown / hardcoded count | Incomplete | → GAP‑3.3 |
| 1.8.4 Click=complete; no resume; progress from quizzes | Outdated (resolved) | Resume + lesson percent exist; completion criteria → GAP‑3.1 |
| 1.8.4 Comments use `CourseCommentContext` | Valid | Root context remains (cleanup) |
| 1.8.5 Failure shows % not counts | Outdated (resolved) | Counts shown |
| 1.8.6 Certificate `.txt`/not PDF | Valid | → GAP‑3.6 |
| 1.8.6 Certificate for any course w/ quizzes | Outdated (resolved) | `certificateEnabled` |
| 1.8.7 Missing min‑price/format filters | Incomplete | → GAP‑5.4 |
| 1.8.8 All formats shown regardless of admin | Incomplete | `getAvailableFormats` exists; verify per‑book |
| 1.8.9 Hardcoded addresses; invoice text not PDF | Valid | → GAP‑5.5 |
| 1.8.10 Lorem reader; ownership by book id | Outdated (resolved) | Per‑book content + `hasBookReaderAccess` |
| 1.9.1 Clinic cards missing doctor/services | Incomplete | → GAP‑4.3 |
| 1.9.2/1.9.3 No schedule; fixed date/price | Outdated (resolved) for routing; Incomplete for admin slots → GAP‑4.1 |
| 1.9.4 Hardcoded consultation prices | Incomplete | → GAP‑4.5 |
| 1.9.5 Portal URL synthetic | Outdated (resolved) | Stored record id |
| 1.9.6 No package session booking/consumption | Outdated (partial); model wrong → GAP‑4.7 |
| 1.9.7 Portal doesn't use stored bookings | Outdated (resolved) | `getStoredConsultationById` |
| 1.9.8 Trips hardcode `$`; no sort | Incomplete | → GAP‑5.1 |
| 1.9.9/1.9.10 No initial consultation flow | Outdated (resolved) for routing; completion → GAP‑1.1/4.9 |
| 1.9.11/1.9.12 Initial consultations missing | Incomplete | Bookable; completion → GAP‑1.1/4.9 |
| 1.10.1 Global local chat; hardcoded online count | Incomplete | Window/moderation → GAP‑6.3 |
| 1.10.3–1.10.5 Root contexts; no active filtering | Incomplete | → CC‑7 / GAP‑6.1/6.2 |
| 1.10.6 Misleading route; attachment name only | Incomplete | → GAP‑6.5 |
| 1.10.7/1.10.8 Monograph redirect/preview/inactive | Outdated/Incomplete | Detail gaps → GAP‑6.6 |
| 1.11 Auth gate / structured answers / draft | Incomplete | Model + placement → GAP‑7.4 |
| 1.12 Subscription expiry not driving active status | Incomplete (Valid core) | → GAP‑1.2 |
| 1.13 Footer requires login | Incomplete | → Phase 7/8 |
| 1.14 AI generic not keyword‑based | Outdated (resolved) | Keyword‑first; scope/disclaimer → GAP‑7.3 |
| 1.15 Dashboard demo records | Outdated (resolved) | Selectors from services; summaries → GAP‑8.1 |
| 1.15.x Account subsection gaps (PDF cert, installments, address) | Incomplete | → Phases 2/3/4/5/8 |

### 5.3 `FINAL_FRONTEND_BUSINESS_ALIGNMENT_AUDIT.md` (prior audit)

A 12‑section consolidation that tallied 129 use cases and 38 consolidated gaps (GAP‑001…038), then proposed a 6‑phase roadmap. **Two cautions:**

1. **Scope interpretation differs.** That document excluded only `2.1` (dashboard home) and treated the rest of Section 2 (admin) as in‑scope/missing. **This plan excludes all of Section 2** per the Dashboard Exclusion Rule, so its "66 missing admin" findings are reclassified as **⛔ Excluded** (Appendix A).
2. **Several of its findings are already stale** vs the current tree (admin shell + routes, doctor portal, slot‑preserving checkout, keyword AI, expanded search, package sessions, format ownership). Its still‑valid customer findings are absorbed into Phases 1–8 above.

### 5.4 Prior `DETAILED_FRONTEND_BUSINESS_ALIGNMENT_IMPLEMENTATION_PLAN.md` (superseded)

The prior draft proposed Phases 0–12 including **Phases 8–11 for building the admin app**. Because admin is out of scope here, those phases are dropped. Its customer‑facing phases (0–7, 12) map onto this plan's Phases 1–8. **This document supersedes the prior draft.**

### 5.5 Findings carried forward (net of resolved work)

Do **not** re‑litigate as new work (already resolved): browser alerts, basic checkout review/failure, slot preservation, trip seat decrement, keyword AI, doctor/admin route shells, format‑specific ownership, package session scheduling existence, trip/clinic booking routes, expanded search, `AccessDeniedState` pattern, persistent podcast player, deterministic progress.

Still valid → owned by phases above: **consultation completion (GAP‑1.1)**, **subscription expiry (GAP‑1.2)**, prerequisite re‑checks (GAP‑1.3), booking detail split (GAP‑1.4), home subscription CTAs (GAP‑8.3), guest/footer newsletter (Phase 7/8), mock‑seeded featuring (CC‑6), PDF certificates/invoices (GAP‑3.6), care currency (GAP‑4.10/CC‑5), community dual stack (CC‑7/Phase 6), auth integrity (Phase 2), book address CRUD (GAP‑5.5), search completeness (GAP‑7.1), package model rework (GAP‑4.7), portal 30‑min/rich text (GAP‑4.8), health‑assessment model/placement (GAP‑7.4).

---

## 6. Requirement Coverage Matrix

Every Section 1 (customer) requirement appears below. "Phase" is where the remaining work is owned (— = no work / effectively complete).

| Business Requirement | Status | Evidence In Code | Phase |
| -------------------- | ------ | ---------------- | ----- |
| 1.1 Customer start / guest gating | ⚠️ Partial | `site-layout.tsx:91–97`, `auth-action-gate.tsx:21–24`, `auth-page.tsx:34–39` | 8 |
| 1.2 Homepage | ⚠️ Partial | `home-page.tsx` (hero/CTAs/featured/FAQ); popup `:28–41` | 8 |
| 1.3 Header | ✅ Effectively complete | `site-layout.tsx:29–97` | — |
| 1.4 Footer | ⚠️ Partial | `site-layout.tsx:159–275`, `SITE_CONTACT` | 8 |
| 1.5 Visitor limits | ⚠️ Partial | `requireAuthAction`, `AuthActionGate`, `auth-required-dialog.tsx:46–52` | 1, 8 |
| 1.6 Register & login (OTP, reset) | ⚠️ Partial | `auth-page.tsx:114–468` (no resend) | 2 |
| 1.7 Site‑wide search | ⚠️ Partial | `search-index.service.ts:12–59`, `search-page.tsx` | 7 |
| 1.8 Education hub | ⚠️ Partial | `education-page.tsx` | 3, 5 |
| 1.8.1 Courses list | ⚠️ Partial | `course-catalog.tsx:43–208`, `courses.service.ts:126–141` | 3 |
| 1.8.2 Course detail | ⚠️ Partial | `course-detail-page.tsx:39–177` | 3 |
| 1.8.3 Enroll & pay | ⚠️ Partial | `checkout-page.tsx:275–500`, `enrollment.service.ts:50–59` | 3 |
| 1.8.4 Course content | ⚠️ Partial (order ❌) | `course-player.tsx`, `course-progress.service.ts:59–65` | 3 |
| 1.8.5 Quizzes | ⚠️ Partial | `quiz-player.tsx`, `quiz-attempt.service.ts:103–122` | 3 |
| 1.8.6 Completion & certificate | ⚠️ Partial | `certificate.service.ts:25–304` (HTML) | 3 |
| 1.8.7 Books list | ⚠️ Partial | `book-catalog.tsx:32–133`, `books.service.ts:71–74` | 5 |
| 1.8.8 Book detail | ⚠️ Partial | `book-detail-page.tsx:75–218` | 5 |
| 1.8.9 Book purchase | ⚠️ Partial | `checkout-page.tsx:150–583`, `book-purchase.service.ts:44–75` | 5 |
| 1.8.10 Ebook reading | ⚠️ Partial | `book-reader.tsx:84–258` | 5 |
| 1.8.11 Education encyclopedia | ⚠️ Partial | `encyclopedia-list.tsx:22–212`, `encyclopedia.service.ts` | 5 |
| 1.8.12 Encyclopedia item detail | ⚠️ Partial | `encyclopedia-detail.tsx:67–171` | 5 |
| 1.9.1 Clinics page | ⚠️ Partial | `clinic-page.tsx:13–64`, `care-data.service.ts:149–151` | 4, 1 |
| 1.9.2 Clinic detail | ⚠️ Partial | `clinic-detail-page.tsx:40–126` | 4, 1 |
| 1.9.3 Clinic appointment booking | ⚠️ Partial | `book/page.tsx`, `checkout-page.tsx:217–314`, `slot-repository.service.ts` | 1, 4 |
| 1.9.4 Consultations page | ⚠️ Partial | `booking-flow.tsx:12–94` | 4 |
| 1.9.5 Individual consultation booking | ⚠️ Partial | `booking-flow.tsx`, `checkout-page.tsx:339–340`, `chat-consultation.tsx:98–99` | 4, 1 |
| 1.9.6 Consultation package | ❌ Incorrect | `checkout-page.tsx:364–382`, `consultations-page.tsx:73–101` | 4 |
| 1.9.7 Consultation portal | ⚠️ Partial | `portal-eligibility.service.ts:31–33`, `chat-consultation.tsx`, `consultation-detail.tsx:158–176` | 4 |
| 1.9.8 Trips page | ⚠️ Partial | `trips-page.tsx:15–70`, `trip-capacity.service.ts:22–38` | 5, 1 |
| 1.9.9 Trip detail | ⚠️ Partial | `trip-detail-page.tsx:49–161` | 5, 1 |
| 1.9.10 Trip purchase | ⚠️ Partial | `checkout-page.tsx:386–404`, `care-records-storage.service.ts:78–83` | 5, 1 |
| 1.9.11 Clinic initial consultation | ❌ Incorrect | `clinic-detail-page.tsx:59–84`, `care-prerequisite.service.ts:46–48` | 1, 4 |
| 1.9.12 Trip general initial consultation | ❌ Incorrect | `initial-consultation/page.tsx:30–45`, `care-prerequisite.service.ts:36–48` | 1, 4 |
| 1.10 Community hub | ⚠️ Partial | `community-home-page.tsx:30–57`, `community-sections.service.ts` | 6, 1 |
| 1.10.1 Group chat | ❌ Incorrect | `community-chat.tsx:18–151`, `community-chat-storage.service.ts:29–34` | 6, 1 |
| 1.10.2 Podcast | ⚠️ Partial | `podcast-library.tsx:34–157`, `podcasts.service.ts:86–111` | 6, 1 |
| 1.10.3 Articles/blogs | ⚠️ Partial | `blogs-page.tsx`, `blog-detail-page.tsx:51–199`, `community-content.service.ts:237–241` | 6 |
| 1.10.4 Theories | ⚠️ Partial | `theories-page.tsx`, `theory-detail-page.tsx:51–72` | 6 |
| 1.10.5 Research | ❌ Incorrect | `researches-page.tsx:21–38` | 6 |
| 1.10.6 Cooperation/suggestions | ⚠️ Partial | `podcast-request-form.tsx:39–233`, `cooperation-request.service.ts:12–58` | 6 |
| 1.10.7 Plants/fungi list | ⚠️ Partial / dup | `monograph-list.tsx:18–109`, `monograph.service.ts:38–58` | 6 |
| 1.10.8 Plant/fungus detail | ⚠️ Partial | `monograph-detail.tsx:46–190` | 6, 1 |
| 1.11 Health assessment | ⚠️ Partial | `health-assessment-page.tsx`, `account-records.service.ts:89–104` | 7 |
| 1.12 Subscriptions | ⚠️ Partial | `subscriptions-page.tsx`, `checkout-page.tsx:212–262`, `subscriptions.service.ts` | 1, 6 |
| 1.13 Newsletter | ⚠️ Partial | `newsletter-storage.service.ts:18–96`, `newsletter-page.tsx` | 7 |
| 1.14 AI assistant | ⚠️ Partial | `AIChatWidget.tsx:64–201`, `assistant-config.service.ts:44–130` | 7 |
| 1.15 Account home | ⚠️ Partial | `dashboard-page.tsx:27–51`, `account-shell.tsx:10–26` | 8 |
| 1.15.1 Profile edit | ⚠️ Partial | `profile-page.tsx:52–131` | 2 |
| 1.15.2 Change password | ⚠️ Partial | `password-page.tsx:13–32`, `auth-provider.tsx:103–105` | 2 |
| 1.15.3 My courses & certificates | ⚠️ Partial | `courses-page.tsx:36–53` | 3 |
| 1.15.4 My books | ⚠️ Partial | `books-page.tsx:22–33`, `account-selectors.service.ts:196–209` | 5 |
| 1.15.5 Clinic bookings | ⚠️ Partial | `clinic-bookings-page.tsx`, `clinic-booking-detail.tsx:12–27` | 1, 4 |
| 1.15.6 Consultations & packages | ⚠️ Partial | `consultations-page.tsx:62–101`, `account-selectors.service.ts:231–250` | 4 |
| 1.15.7 Purchased trips | ⚠️ Partial | `trips-page.tsx:9–28` (account) | 5 |
| 1.15.8 Subscription status | ⚠️ Partial | `subscription-page.tsx:14–37` | 6 |
| 1.15.9 Payments & invoices | ✅ Effectively complete | `payments-page.tsx:13–41`, `account-selectors.service.ts:282–283` | — |
| 1.15.10 Health assessments | ⚠️ Partial | `health-assessments-page.tsx:17–174` | 7 |
| 1.15.11 Favorites | ⚠️ Partial | `favorites-page.tsx:14–54`, `favorite-button.tsx` | 1, 8 |
| 1.15.12 Notifications | ⚠️ Partial | `notifications-page.tsx:17–41` | 8 |
| 1.15.13 Newsletter management | ✅ Effectively complete | `newsletter-page.tsx:85–259` | — |
| 1.15.14 Logout & delete account | ⚠️ Partial | `security-page.tsx:47–68`, `auth-provider.tsx:108–112` | 2 |
| **All of Section 2 (2.1 → 2.10.4.3)** | ⛔ Excluded | Admin dashboard (لوحة التحكم) — see Appendix A | — |

---

## Appendix A — Dashboard Requirements Excluded From Scope

Per the Dashboard Exclusion Rule, `2.1 الصفحة الرئيسية للوحة التحكم` **and everything under it** — i.e. the entire Admin Control Panel (لوحة التحكم), Section 2 — is **excluded** from this customer‑facing implementation plan. These were read for context only. **No implementation tasks are created for them here.** They will be addressed separately (and the backend is Laravel).

> The repository already contains scaffolded `(admin)` and `(doctor)` route groups; those are intentionally outside this plan. Where a customer flow needs admin‑configured data (e.g. featured flags, consultation types, slot rules, encyclopedia categories), the **customer side reads frontend flags/mock config** — it does not build the admin screen.

### Excluded use cases (context only)

**2.1 — Dashboard home:** `2.1 عرض الصفحة الرئيسية للوحة التحكم`

**2.2 Users:** `2.2.1 عرض وإدارة قائمة المستخدمين` · `2.2.2 إضافة حساب مستخدم من لوحة التحكم` · `2.2.3 عرض الملف الكامل للمستخدم` · `2.2.4 تعديل بيانات المستخدم وتغيير حالة حسابه`

**2.3 Courses:** `2.3.1 عرض وإدارة قائمة الدورات` · `2.3.2 إضافة أو تعديل البيانات الأساسية للدورة` · `2.3.3 إدارة أقسام ودروس ومحتوى الدورة` · `2.3.4 إنشاء وإدارة اختبارات الدورة` · `2.3.5 إعداد وإدارة شهادة إكمال الدورة` · `2.3.6 عرض طلاب الدورة ومتابعة تقدمهم` · `2.3.7 إدارة تصنيفات ومستويات الدورات`

**2.4 Books:** `2.4.1 عرض وإدارة قائمة الكتب` · `2.4.2 إضافة أو تعديل بيانات كتاب` · `2.4.3 إدارة تصنيفات الكتب` · `2.4.4 رفع وإدارة ملف الكتاب الإلكتروني` · `2.4.5 عرض وإدارة سجل مشتريات الكتب` · `2.4.6 عرض العملاء المشترين لكتاب محدد`

**2.5 Encyclopedia & herbal library:** `2.5.1 عرض وإدارة قائمة أخبار الموسوعة` · `2.5.2 إضافة أو تعديل خبر في الموسوعة` · `2.5.3 تحديد أخبار اختيارات المحرر` · `2.5.4 إدارة الفلاتر الأربعة وأنواعها في مكتبة الأعشاب` · `2.5.5 عرض وإدارة قائمة الأعشاب` · `2.5.6 إضافة أو تعديل عنصر في مكتبة الأعشاب`

**2.6 Clinics:** `2.6.1 عرض وإدارة قائمة العيادات` · `2.6.2 إضافة أو تعديل بيانات العيادة والطبيب` · `2.6.3 إدارة تصنيفات العيادات` · `2.6.4 إدارة الخدمات العامة الظاهرة في قسم الرعاية` · `2.6.5 إعداد وإدارة جدول المواعيد الموحد للطبيب` · `2.6.6 إعداد قواعد حجز المواعيد الحضورية` · `2.6.7 إعداد الاستشارة الأولية المرتبطة بالطبيب والعيادة` · `2.6.8 عرض وإدارة حجوزات العيادات`

**2.7 Consultations:** `2.7.1 عرض أطباء الاستشارات وإدارة إعداداتهم` · `2.7.2 إعداد أنواع الاستشارات الفردية للطبيب` · `2.7.3 إضافة وتعديل وإدارة باقات الاستشارات` · `2.7.4 عرض وإغلاق حجوزات الاستشارات` · `2.7.5 عرض مشتريات باقات الاستشارات وجلساتها` · `2.7.6 استخدام بوابة الطبيب للمواعيد والاستشارات`

**2.8 Trips:** `2.8.1 عرض وإدارة قائمة باقات الرحلات` · `2.8.2 إضافة أو تعديل باقة رحلة` · `2.8.3 إدارة تصنيفات باقات الرحلات` · `2.8.4 عرض وتصدير مشتريات باقات الرحلات` · `2.8.5 إعداد الاستشارة الأولية العامة المطلوبة لشراء الرحلات`

**2.9 Community:** `2.9.1 إدارة محادثة المجتمع الجماعية` · `2.9.2 عرض وإدارة قائمة حلقات البودكاست` · `2.9.3 إضافة أو تعديل حلقة بودكاست` · `2.9.4 إضافة وعرض وإدارة المقالات` · `2.9.5 إضافة وعرض وإدارة النظريات` · `2.9.6 إضافة وعرض وإدارة الأبحاث والدراسات` · `2.9.7 مراجعة وحذف التعليقات` · `2.9.8 إدارة أنواع التعاون والاقتراحات` · `2.9.9 عرض ومراجعة طلبات التعاون والاقتراحات` · `2.9.10 إدارة تصنيفات النباتات والفطريات` · `2.9.11 عرض وإدارة عناصر موسوعة النباتات والفطريات` · `2.9.12 إضافة أو تعديل عنصر في موسوعة النباتات والفطريات`

**2.10.1 Health assessment admin:** `2.10.1.1 عرض وإدارة أقسام التقييم الصحي` · `2.10.1.2 إدارة الحالات والأمراض التابعة لأقسام التقييم` · `2.10.1.3 عرض ومراجعة تقييمات العملاء الصحية` · `2.10.1.4 عرض تفاصيل تقييم العميل وتصديره`

**2.10.2 Subscriptions admin:** `2.10.2.1 عرض وإدارة خطط الاشتراك` · `2.10.2.2 إضافة أو تعديل خطة اشتراك` · `2.10.2.3 تطبيق قواعد شراء وتجديد الاشتراك` · `2.10.2.4 عرض ومراجعة اشتراكات العملاء`

**2.10.3 Newsletter admin:** `2.10.3.1 عرض وإدارة قائمة المشتركين في النشرة البريدية` · `2.10.3.2 إنشاء وإرسال رسالة نشرة بريدية` · `2.10.3.3 عرض وإدارة سجل رسائل النشرة البريدية`

**2.10.4 AI assistant admin:** `2.10.4.1 إدارة الإعدادات العامة لمساعد B3 AI` · `2.10.4.2 إضافة وتعديل الكلمات المفتاحية وإجابات المساعد` · `2.10.4.3 استخدام المساعد وفق الكلمات المفتاحية`

---

*End of plan. This document supersedes the prior `DETAILED_FRONTEND_BUSINESS_ALIGNMENT_IMPLEMENTATION_PLAN.md` draft and consolidates the valid findings from `UI_BUSINESS_GAP_PLAN.md`, `UI_BUSINESS_MISSING_GAPS_PLAN.md`, and `FINAL_FRONTEND_BUSINESS_ALIGNMENT_AUDIT.md`.*
