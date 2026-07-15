# Frontend ↔ Business ↔ Backend Alignment Audit

> Audited **all 51 client-website features** (`backend/docs/actors/موقع_العميل/`) against the frontend and the backend enforcement. Method: 6 parallel domain reviewers, each cross-checking the business spec's `analysis_fragment.md` rules → frontend behavior → backend controller. This doc lists **only misalignments** (what's correct is summarized per section).

## Fix status (this session)

**Fixed & verified (tsc 0 · 46 tests · lint clean):**
- H3 — My-Books invoice now uses `downloadAuthenticatedFile` (was 401).
- M8 — clinic initial-consultation flow now shows the health-assessment prompt.
- M10/M11 — research list + detail now show a subscribe/sign-in CTA on 403 (was empty / "not found").
- M3 — courses catalog + detail now use the global currency switcher (was hardcoded USD).
- M17 — site footer now pulls contact + social from the backend (`/general/contact`, `/general/social-media`), with static fallback.
- LOW — clinic appointment block message now distinguishes "complete initial consultation" vs "you have an active booking"; removed the "Test Code: 1234" newsletter hints on the real path.

**Deferred by owner decision:**
- **C1 (auth cluster)** — left as-is (do not touch; a separate developer owns the backend and this is the highest-risk area to change without live-backend testing).
- **C2 (consultation individual/package booking)** — left as-is.

**Remaining (frontend-only, do NOT touch backend/auth — available as a follow-up):**
H1 ebook-reader ownership from backend · H2 pay-next-section UI · M1 quiz result panel · M2 resume `last_position` · M4 books catalog currency/price filters · M6 encyclopedia `editor_picks` · M7 book checkout add-address · M9 health-prompt gating on real data · M12 avatar persistence · M13 dashboard backend reads · M14 notifications unread badge · M15 newsletter cancel-pending · M16 homepage `healing_stories`/`packages` · search podcast/faq detail routes.

---

## Systemic root cause

Many features carry a **dual implementation**: real backend-wired service functions exist, but the UI still drives the flow through the **local `auth-provider` / `*-storage.service` mock path**. The backend functions are frequently **dead code** (defined, never imported). A user who logs in via the real API often has no follow-through, because subsequent actions read/write `localStorage` instead of the API. The fixes below either wire the UI to the existing backend service or remove flows the backend cannot support.

---

## 🔴 CRITICAL

### C1 — Auth cluster runs on the mock path, not the backend
The whole account-security surface bypasses the backend it has services for:
- **Registration OTP** (`auth-page.tsx:335`, `auth-storage.service.ts:7`): verifies against a **hardcoded `MOCK_OTP='482731'`**; `verifyBackendCode()` never called. Register also opens the OTP modal **before** any backend call and `setUser()`+redirects to `/dashboard` with **no token** (inactive account treated as authenticated).
- **Forgot-password** (`auth-page.tsx:398-475`): send/verify/reset all local-only; `requestBackendPasswordReset`/`verifyBackendPasswordResetCode`/`resetBackendPassword` never called.
- **Password change** (`password-page.tsx:27` → `auth-provider.tsx:154`): `changeStoredPassword` only; `changeBackendPassword` dead.
- **Account deletion** (`security-page.tsx:53`, `auth-provider.tsx:159-240`): impact is a **hardcoded** paragraph (`getBackendAccountDeletionImpact` dead); deletion gates on a **local** password match and fires `deleteBackendAccount()` fire-and-forget — a backend-only user is blocked with "account not found."
- **Resend code** (`use-otp-resend.ts`): register/forgot resend only resets the cooldown; `resendBackendCode` never called.

**Impact:** on the real backend, registration/verification/password-reset/password-change/deletion do not actually work. **High-risk to fix** (critical path, needs live-backend testing).

### C2 — Individual & package consultation booking are live mock flows the backend cannot support
`/consultations` catalog + `/consultations/{doctorId}/book` + `/consultations/package/{id}/book` (`consultations/components/{booking-flow,individual-booking-flow,package-booking-flow}.tsx`) list mock doctors/packages and "complete" a **simulated payment** in `checkout-page.tsx:398-488` (localStorage only). **No backend endpoint exists** for these (only the read/chat portal does). Records never reach the real system, so they don't appear in "My Consultations" and their detail/chat links 404. **Needs a product decision:** remove/hide these flows, or keep them clearly labeled as unavailable.

---

## 🟠 HIGH

- **H1 — Ebook reader ownership gate reads localStorage** (`book-reader.tsx:27`, `book-purchase.service.ts:29`): a user who bought an ebook via the API is **denied** the `/read/[id]` reader (mock `b3-book-purchases` is never written by the API checkout). Backend `stream-ebook` still protects content (no leak), but legitimate owners are locked out.
- **H2 — Per-section "pay next section" has no UI** (`course-player.tsx`, `account-sections/courses-page.tsx`): backend provides `actions.pay_next_section {section_id}` + `sections_payment`, mapped in the service but **consumed by no component**. Installment/per-section users can't pay the next section in-app.
- **H3 — My-Books invoice download will 401** (`MyBooksPanel.tsx:29`): uses a plain `<a href={getMyBookInvoiceUrl()}>` — the endpoint needs the Bearer token; must use `downloadAuthenticatedFile` like every other invoice.

---

## 🟡 MEDIUM

**Courses**
- M1 — Quiz result panel not rendered (`course-player.tsx:103`): only a pass/fail toast; backend `correct_count`/`wrong_count`/`answers_review` ignored.
- M2 — Resume ignores `last_position`/`actions.continue_learning` (`course-player.tsx:50`): "Continue" always lands on lesson 1.
- M3 — Catalog + detail currency hardcoded `'USD'` (`CourseCatalogPage.tsx:15`, `CourseDetailView.tsx:18`): ignores the global `useCurrency`; prices never change with the switcher (checkout is correct).
- M5 — Account course card omits the paid/unpaid section breakdown (`sections_payment` mapped, never shown).

**Books / Encyclopedia**
- M4 — Books catalog: no currency filter, no price-range filter; prices render as bare numbers with no currency (`BookCatalogPage.tsx`, `BookCard.tsx:34`).
- M6 — Encyclopedia "Editor's Pick" uses the first 4 herbs instead of the backend `editor_picks` set (`encyclopedia-api.service.ts:152`).
- M7 — Book checkout has no "add new address" flow (`BookCheckoutPage.tsx:92`): a user with zero saved addresses can't buy physical/bundle.

**Care**
- M8 — Clinic initial-consultation flow is missing the health-assessment optional prompt (trip IC has it) (`clinic-initial-consultation-flow.tsx`).
- M9 — Health-prompt "should show" gating reads mock localStorage (`health-assessment-prompt.service.ts:9-33`), disconnected from real submissions/consultations → stale.

**Community**
- M10 — Research **list** shows an "empty" state instead of a subscribe CTA for non-subscribers (403 ignored) (`CommunityPostListPage.tsx:20`, `use-community-post-list.ts`).
- M11 — Research **detail** shows "Content not found" instead of a subscribe CTA (whole endpoint 403s) (`CommunityPostDetailPage.tsx:32`).

**Onboarding / Account (read side)**
- M12 — Profile **avatar** change not persisted to backend (`profile-api.service.ts:20`).
- M13 — Account **dashboard** built from localStorage selectors; calls no backend read endpoints (`dashboard-page.tsx:54`).
- M14 — Notifications **unread badge** computed from localStorage; `useBackendUnreadNotificationCount` unused (`account-shell.tsx:31`).
- M15 — Newsletter **cancel-pending** calls local `unsubscribeNewsletter` only in backend mode (`newsletter-page.tsx:252`).
- M16 — Homepage drops backend `healing_stories`/`packages`/`latest_releases`; renders hardcoded testimonials (`home-page.tsx:62`, `site-content-api.service.ts:167`).
- M17 — Footer contact/social are hardcoded placeholders; `/general/contact` + `/general/social-media` (hooks exist) never called (`site-layout.tsx:224`).
- M18 — Login of an inactive account is mishandled → malformed user (`auth-provider.tsx:100`).

**AI** — M19 — Assistant runs a local keyword engine; backend `/general/ai-assistant` (admin content + `is_enabled` gate) unused. **Decision item.**

---

## 🟢 LOW / cosmetic

- Search: `podcast`/`faq` results link to the list, not the detail (`/podcast/{id}` exists) (`search.types.ts:82`).
- Courses: featured capped at 3; lesson completion manual vs spec's auto-complete; dead `quiz-player.tsx`.
- Care: clinic-appointment block message always says "complete initial consultation" even when the block is really "one active booking per doctor"; dead `checkout-page.tsx` consultation/clinic-appointment branches.
- Community: AI default replies embed direct links (spec says not to); newsletter "Test Code: 1234" hint shown on the real path; group-chat renders all non-admin messages right-aligned as "mine" (backend has no `is_own` flag).
- Books: plants-fungi list/category hooks fire before the subscription gate (403, wasteful); raw `stream-ebook` link is savable (weakens no-download).

---

## ✅ Correctly aligned (verified)

Visitor gating + pending-intent return; login; logout; email-change verification; newsletter double opt-in; search (min-2, grouped, subscription badge); notifications core actions (list/read/read-all/delete-many); clinic appointment + clinic IC booking (prerequisite gating, slot-not-held + fulfill-slot, no self-cancel); care execution portal (chat gated on `can_interact`, video on `can_join`, invoices); account clinic bookings; health-assessment form + history; trip catalog/IC/purchase + account trip-packages; subscriptions (block-while-active, no-auto-renew, guest→login, currency-updates-price, empty-state); account payments (invoice-only-on-success); articles/theories (public read, per-post lock CTA, auth-gated like/comment); group-chat (subscription gate distinguished from other errors, admin-vs-member, send-permission); collaboration; podcast list + cross-page playback.
