# B3 Academy Frontend Missing Work From Document And Backend Audit

Date: 2026-07-05

Sources reviewed:

- `B3 Academy new.docx`
- `backend/routes/Api/user.php`
- `backend/routes/Api/general.php`
- `backend/routes/web.php`
- Current Next.js frontend under `src/app/`, `src/features/`, `src/components/`
- Existing endpoint note: `unused_endpoints.md`

Operating constraint:

- Backend code is fixed. Do not add, edit, or depend on new Laravel routes, controllers, resources, migrations, jobs, or dashboard changes.
- Frontend must align with the business document as much as possible using only the existing backend API surface and frontend code.
- Where the document requires a capability that the backend does not expose, the frontend should either:
  - implement a clearly bounded client-side experience when the data can safely be local/prototype-only,
  - consume existing static/local services while keeping the UI business-correct,
  - or show a polished unavailable / pending-backend state instead of calling non-existent endpoints or pretending persistence exists.

## Executive Summary

The frontend has a broad visual and route-level implementation for the customer site, account dashboard, admin dashboard, doctor portal, learning reader, book reader, checkout, community, subscriptions, and care flows. At the screen inventory level it aligns with a large part of the Word document.

The main gap is not the number of pages. The main gap is backend integration and business-rule completeness. Many frontend modules still depend on local mock data, seeded records, and `localStorage` services, while the Laravel backend exposes real APIs for several domains and a Blade dashboard for many admin domains.

Approximate alignment:

- Customer routes and navigation coverage: high, roughly 75 percent.
- Backend API consumption: medium, roughly 40 percent.
- Document business-rule fidelity: medium, roughly 45 percent.
- Admin feature coverage versus backend dashboard: medium-low, roughly 35 percent.
- Production readiness for persisted user journeys: low-medium, roughly 35 percent.

Important mismatch: the frontend added course API calls, but the Laravel API routes reviewed do not define course endpoints. Because backend changes are out of scope, the frontend must not rely on those course API paths. It should fall back to local course services or disable backend-dependent course checkout/progress sync in a business-clear way.

## Frontend-Only Strategy

Since backend changes are not allowed, the frontend should follow this hierarchy:

1. Use existing backend APIs wherever they exist.
2. Remove or guard calls to endpoints that do not exist.
3. Keep UI and user journeys aligned with the Word document even when persistence is local.
4. Clearly separate production-backed flows from local/prototype flows in code and UX.
5. Do not invent fake backend success for transactional flows such as payments, bookings, subscriptions, account deletion, or purchases.

Frontend behavior rules under this constraint:

- Existing backend-backed flows should be made production-grade: auth where available, books, subscriptions, platform reviews, articles/theories/research, podcasts, plants/fungi, cooperation, general content, newsletter, notifications, profile, addresses.
- Backend-missing flows should be implemented as business-faithful frontend flows using local state only when safe: learning progress, health assessment draft/history, assistant keyword config, search index, favorites, UI-only admin prototypes.
- Backend-missing transactional flows should not imply real fulfillment. For clinics, consultations, trips, and course purchases, the UI can present the journey, collect intent, and show a clear "request received locally / feature pending service activation" style state only if the business accepts that. Otherwise the action should be disabled with a polished message.
- Admin pages should not claim to manage backend records unless they call an existing backend route. They can remain frontend configuration/prototype pages, but copy and state labels should make that honest.

## Backend Surface Reviewed

### Public And Customer API Routes Present In Laravel

Base route group in `backend/routes/api.php` is `/api/v1`, with `user` and `general` prefixes.

General API:

- `POST /api/v1/general/contact-messages`
- `GET|POST /api/v1/general/payments/callback`
- `GET /api/v1/general/about`
- `GET /api/v1/general/terms`
- `GET /api/v1/general/privacy`
- `POST /api/v1/general/change-lang`
- `GET /api/v1/general/countries`
- `GET /api/v1/general/faqs`
- `GET /api/v1/general/social-media`
- `GET /api/v1/general/contact`

Customer API:

- Homepage: `GET /api/v1/user/home`, `GET /api/v1/user/sliders`, `GET /api/v1/user/academic-specializations`
- Platform reviews: `GET /api/v1/user/platform-reviews`, `POST /api/v1/user/platform-reviews`
- Books: `GET /api/v1/user/books/categories`, `GET /api/v1/user/books/featured`, `GET /api/v1/user/books`, `GET /api/v1/user/books/{id}`, `GET /api/v1/user/books/{id}/stream-ebook`, `POST /api/v1/user/books/{id}/checkout`
- My books: `GET /api/v1/user/my-books`, `GET /api/v1/user/my-books/{order}`, `GET /api/v1/user/my-books/{order}/invoice`
- Encyclopedia: index, news types, news list/detail, herbal families/species/genera/origins/list/detail
- Subscriptions: plans, plan detail, checkout, current subscription
- Payment methods: `GET /api/v1/user/payment-methods`
- Podcast: list/detail
- Articles: list/detail/comments, authenticated like/comment
- Theories: list/detail/comments, authenticated like/comment
- Research: subscription-gated list/detail/comments, like/comment
- Plants/fungi: subscription-gated categories/list/detail
- Auth: login, register, forgot password, OTP resend/verify, reset password, logout, delete-account impact, delete account
- Profile: show, update, email change OTP flow, password change
- Newsletter: show, subscribe, verify, resend, unsubscribe
- Addresses: list, create, update, set default, delete
- Collaboration: types and request submission
- Notifications: list, show, unread count, read/read-all, delete/delete-many/clear-all, toggle preferences

### Backend Dashboard Surface Present In Laravel

The Laravel dashboard already has many server-rendered admin resources:

- Admins, roles, users, countries, FAQs, contact messages
- General settings, about, terms, privacy, homepage sliders, healing stories
- Academic specializations
- Encyclopedia news and herbal taxonomy/library
- Social media
- Subscription plans, payment methods, client subscriptions
- Book categories, books, ebook files, book orders, book buyers exports
- Collaboration types and collaboration requests
- Podcast episodes
- Articles, theories, research, and comments
- Plants/fungi taxonomy and items
- Newsletter subscribers, send campaign, send log
- Platform reviews
- Notifications and scheduled/broadcast notification tooling

The Next.js admin dashboard overlaps with this surface but does not yet fully replace it.

## Frontend Surface Found

The frontend already includes route shells for:

- Public site: home, about, contact, FAQ, terms, privacy, search, ratings
- Education: education overview, courses, course detail, course player, books, book detail, book reader, encyclopedia, monograph
- Care: clinics, clinic detail, clinic booking, consultations, package booking, trips, trip detail, initial consultation
- Community: community home, group chat, blogs/articles, theories, research, cooperation, podcast request, podcasts
- Subscriptions and checkout
- Auth
- Account dashboard sections: profile, password, security, courses, books, clinic bookings, consultations, trips, subscription, payments, health assessments, favorites, notifications, newsletter
- Admin dashboard: overview, users, courses, books, encyclopedia, clinics, consultations, trips, schedule, community, podcasts, newsletter, assistant
- Doctor portal and appointment detail

API services already exist for:

- Books: real backend paths are used.
- Subscriptions and payment methods: real backend paths are used.
- Platform reviews: real backend paths are used.
- Society/community posts, podcasts, plants/fungi, cooperation: real backend paths are used.
- Courses: API services exist, but backend routes are missing.

Major local/mock storage remains in:

- Auth and account session
- Profile, password, account deletion, addresses
- Care clinics/consultations/trips and booking records
- Learning enrollment/progress/quiz/certificates
- Payments and invoices
- Health assessment records/config
- Newsletter state and campaign logs
- Admin CRUD for many domains
- Search index
- AI assistant keyword configuration

## High-Priority Missing Work

### 1. Unify API Base Paths And Auth Token Handling

Current state:

- `apiFetch` defaults to `http://portal.b3.raiyan.cc/`.
- Services call paths such as `/api/user/books`, but Laravel routes are grouped under `/api/v1/user`.
- The auth token key used by `apiFetch` is `b3_api_token`, but the current auth provider is local-storage based and does not persist Laravel tokens.

Missing work:

- Decide whether `NEXT_PUBLIC_API_BASE_URL` should include `/api/v1` or whether service paths should include `/api/v1`.
- Normalize all service paths to one convention.
- Integrate Laravel login/register responses with the frontend auth provider.
- Persist the token expected by `apiFetch`.
- Add logout token invalidation.
- Add global handling for `401 unauthenticated`, `403 subscription_required`, `422 validation`, and network errors.
- Ensure `Accept-Language` or locale header is sent consistently to match backend `set.locale.from.header`.

Acceptance criteria:

- A successful backend login stores the API token and current user.
- Authenticated API requests include `Authorization: Bearer ...`.
- Refreshing the browser keeps the user session if the token is valid.
- Invalid/expired tokens clear the session and redirect or open auth flow.

### 2. Replace Local Auth With Backend Auth And OTP Flows

Document requirement:

- Visitors can browse freely.
- Actions require registration/login.
- Registered users see account access instead of login/register.
- Registration, verification, password reset, logout, and account deletion must follow system rules.

Backend available:

- Login, register, forgot password, resend code, verify code, reset password.
- Logout and delete account.
- Delete-account impact endpoint.

Frontend current state:

- `auth-provider.tsx` uses `authenticateAccount`, `createAuthAccount`, and local seed accounts.
- OTP is mocked with `MOCK_OTP`.
- Delete account manually scrubs local-storage records.

Missing work:

- Implement `auth-api.service.ts` for all Laravel auth endpoints.
- Update `AuthProvider` to call backend APIs.
- Replace mocked OTP with backend verification screens.
- Add account activation verification after registration if backend requires it.
- Replace local delete-account cleanup with backend `delete-account/impact` and `delete-account`.
- Map backend blocked/inactive/deleted account states to UI errors.
- Keep pending intent behavior, but replay it after real backend auth succeeds.

Acceptance criteria:

- Login/register/reset flows work against Laravel.
- Auth errors are displayed under fields or via toast according to repo conventions.
- The app no longer relies on seeded demo users for production paths.

### 3. General Content, Homepage, Header, Footer, FAQ, Contact

Document requirement:

- Homepage uses admin-selected content: visual hero, logo/slogan, academy advantages, selected courses/books, healing stories, subscriptions, FAQ.
- Header includes education, care, community, subscriptions, ratings, search, auth/account.
- Footer includes logo, description, quick links, contact data, social links, legal links, newsletter subscription.

Backend available:

- `/general/about`, `/terms`, `/privacy`, `/countries`, `/faqs`, `/social-media`, `/contact`
- `/user/home`, `/user/sliders`, `/user/academic-specializations`
- Dashboard resources for general settings, homepage sliders, healing stories, FAQ, social media.

Frontend current state:

- Header and footer exist.
- Some Arabic text is mojibake in code, meaning source text appears incorrectly encoded.
- Home/site content is mostly static service data.
- Newsletter in footer is local-storage based.

Missing work:

- Add general API service for about, terms, privacy, FAQ, social media, contact.
- Add homepage API service for home payload, sliders, academic specializations.
- Replace static home sections with backend-driven data.
- Decide how to represent "academy advantages" from existing backend home/general payloads where possible; otherwise keep this section frontend-configured/local.
- Replace static `SITE_CONTACT` with `/general/contact` and `/general/social-media`.
- Fix mojibake Arabic strings in layout and admin labels.
- Integrate footer newsletter with backend newsletter subscription flow.
- Ensure no fake fallback course/book content appears when admin has not selected items, matching the document.

Acceptance criteria:

- Header/footer labels render valid Arabic text.
- FAQ/contact/legal pages load from backend.
- Homepage uses backend selected/active content.
- Empty selected-content sections do not show unauthorized placeholder content.

### 4. Courses Domain Must Be Frontend-Owned Because Backend API Is Missing

Document requirement:

- Public course listing/detail.
- Course purchase with full or installment payment.
- Learning player with sections, lessons, sequential access rules, tests, final exam, certificates.
- Account dashboard for "My courses and certificates".
- Admin course CRUD, sections/content, tests, certificates, enrolled students, categories/levels.

Frontend current state:

- Course public pages, course player, account course page, admin course pages exist.
- `courses-api.service.ts` calls `/api/user/courses/*`.
- Local course service and learning services implement many rules in browser storage.

Backend current state:

- No course routes were found in `backend/routes/Api/user.php`.
- Laravel dashboard routes also do not show course resources in the reviewed backend `web.php`.

Missing work:

- Remove or guard calls to `/api/user/courses/*`, because these endpoints do not exist in the fixed backend.
- Use the existing local course service as the frontend source of truth.
- Make the course UI match the document: catalog, detail, sections, lessons, tests, final exam, certificates, installment/full-payment messaging, and account "My courses".
- For course checkout, do not fake a backend payment. Either:
  - route to a frontend-only demo checkout labeled as not yet connected to backend fulfillment, or
  - disable purchase actions with a polished business message.
- Keep learning progress, lesson completion, quiz attempts, installment entitlements, and certificates in local storage only, with code comments/docs identifying them as frontend-local.
- Admin course pages may manage local course data/prototype records only; UI copy should not imply backend persistence.

Acceptance criteria:

- Course listing/detail does not call missing endpoints.
- Course purchase is either explicitly disabled or clearly marked as frontend-local/demo.
- "My courses" reflects local enrollments without pretending backend ownership.
- Learning progress survives browser refresh on the same device.
- All course screens visually and behaviorally follow the document as far as frontend-only state allows.

### 5. Books Integration Needs Completion Beyond Listing And Checkout

Document requirement:

- Public books with categories, details, purchase options: ebook, printed, or both.
- Ebook reading after purchase.
- Printed order tracking.
- Account "My books".
- Admin books, categories, ebook file management, buyers, orders, exports.

Backend available:

- Public books endpoints, checkout, my-books, invoice, ebook stream.
- Dashboard book categories, books, book files, orders, buyers/export.

Frontend current state:

- Books API service exists and uses real backend paths.
- Local book service and purchase service also exist.
- Reader route exists.

Missing work:

- Confirm the API base path issue so book calls hit `/api/v1/user/books`.
- Wire all book listing/detail/account UI to the API path, not mixed local data.
- Implement authenticated ebook streaming via `/books/{id}/stream-ebook` or signed `read_url`.
- Replace local book purchase records with `my-books`.
- Wire printed-order details and invoices to backend order records.
- Add address management integration for printed orders.
- Complete admin book category/book/file/order/buyer functionality if Next.js admin is expected to replace Laravel dashboard.

Acceptance criteria:

- Purchased ebooks appear in account after backend checkout.
- Ebook reader cannot open unpaid ebooks.
- Printed checkout requires backend address and order status.
- Book invoice URL works with auth and correct base path.

### 6. Subscriptions And Payment Flow Need End-To-End Transaction Handling

Document requirement:

- Subscription plan browsing and purchase/renewal.
- Account subscription status/history.
- Subscription-gated content like research and plants/fungi.
- Admin subscription plan management and client subscription logs.

Backend available:

- Plans, plan detail, checkout, my subscription, payment methods.
- Payment callback.
- Dashboard subscription plans, payment methods, client subscriptions.

Frontend current state:

- Subscription API service exists.
- Local subscription history/access service still exists.
- Checkout page has multi-type behavior and local payment storage.

Missing work:

- Ensure subscription UI uses backend plans and current subscription only.
- Replace local `subscribe` user mutation with backend checkout result.
- Implement payment redirect/callback handling according to backend payment transaction contract.
- Add pending, paid, failed, cancelled states.
- Ensure subscription-gated pages check backend subscription state, not only local `user.isSubscribed`.
- Add account subscription history from `/subscriptions/me`.
- Add admin subscription plan CRUD only if Next.js admin is required.

Acceptance criteria:

- Buying a plan creates a backend payment transaction.
- After payment callback, account subscription updates.
- Gated research/plants-fungi content unlocks based on backend state.

### 7. Care: Clinics, Consultations, Trips Must Stay Frontend-Only Unless Existing APIs Appear

Document requirement:

- Clinics list/detail, clinic booking, initial consultation rules.
- Individual consultations: text/video, doctor schedule, booking, portal access window, read-only after ending.
- Consultation packages with session scheduling.
- Trips list/detail, capacity, purchase, initial consultation, admin follow-up.
- Doctor portal for unified appointments and consultations.
- Admin management for clinics, doctors, categories, services, schedules, bookings, consultations, packages, trips.

Backend available in reviewed routes:

- No public API routes were found for clinics, consultations, trips, schedules, or doctor portal.
- Laravel dashboard route file has no clinic/consultation/trip resources in the reviewed backend, despite frontend and document expecting them.

Frontend current state:

- Rich local implementations exist for clinics, consultations, trips, schedule, bookings, lifecycle, chat, portal eligibility, doctor portal.
- Data and records are local storage.

Missing work:

- Keep care data in frontend services because no backend API can be added.
- Make all care UI match the document: clinics, clinic detail, booking journey, initial consultation rules, individual consultations, packages, trips, capacity messaging, doctor portal, and account records.
- Do not present frontend-local bookings as real confirmed operational bookings unless the business accepts local-only mode.
- For booking/payment actions, use one of two frontend-only patterns:
  - "request submitted / team will contact you" copy if this can map to an existing contact/collaboration endpoint;
  - disabled payment/booking action with "service activation pending" copy if real fulfillment is impossible.
- Keep `care-data.service.ts`, `care-records-storage.service.ts`, `slot-repository.service.ts`, `trip-capacity.service.ts`, and chat storage, but clean them up so they consistently model the business rules.
- Add clear UI states for slot unavailable, sold out, prerequisite initial consultation required, package sessions remaining, text/video portal timing, and read-only ended consultations.
- Admin care pages should manage local/prototype records only and should be labeled internally as frontend-managed until a real backend route exists.

Acceptance criteria:

- Clinic/consultation/trip screens follow the document without calling missing APIs.
- Capacity and slot conflicts are enforced in local state.
- Doctor portal lists locally created assigned appointments.
- Text consultation history persists locally and becomes read-only after the allowed window.
- Any action that cannot be fulfilled by the fixed backend is honestly messaged.

### 8. Community Needs Complete Auth, Gating, Comments, And Chat Alignment

Document requirement:

- Community home.
- Group chat.
- Podcasts.
- Articles.
- Theories.
- Research, likely subscription-gated.
- Cooperation and suggestions.
- Plants/fungi encyclopedia with gated list/detail behavior.
- Comments and likes where allowed.

Backend available:

- Podcast list/detail.
- Articles/theories list/detail/comments, auth like/comment.
- Research subscription-gated list/detail/comments, like/comment.
- Collaboration types/request.
- Plants/fungi subscription-gated categories/list/detail.

Frontend current state:

- Society API services exist for community posts, podcasts, plants/fungi, cooperation.
- Legacy `src/features/community` services still use mock/local content.
- Group chat appears local.

Missing work:

- Ensure all community pages use the API-backed `src/features/society/*` services or remove duplicate legacy paths.
- Implement auth-required handling for likes/comments/cooperation requests.
- Ensure research and plants/fungi display subscription-required state from backend.
- Add pagination, search filters, and empty states matching backend response metadata.
- Replace local group chat with backend if backend support exists, or document that backend group chat is missing. There are backend cursor plans mentioning group chat, but no active route was found in reviewed API routes.
- Ensure comments respect backend "comments_not_allowed".
- Wire podcast request page to backend if a request endpoint exists; otherwise mark as missing backend support.

Acceptance criteria:

- Article/theory/research detail comments come from backend.
- Like/comment actions require login and persist.
- Subscription-required errors show the subscription upsell.
- Group chat is either backed by API or explicitly out of production scope.

### 9. Account Dashboard Must Move Off Local Storage

Document requirement:

- Account home summarizing customer activity.
- Edit profile.
- Change password.
- Courses and certificates.
- Books.
- Clinic bookings.
- Consultations and packages.
- Trips.
- Subscription.
- Payments and invoices.
- Health assessments.
- Favorites.
- Notifications.
- Newsletter management.
- Logout and delete account.

Backend available:

- Profile and password.
- Addresses.
- My books and invoices.
- My subscription.
- Notifications.
- Newsletter status and actions.
- Delete account impact/delete.
- No reviewed backend APIs for courses, care, health assessment, favorites, payments/invoices beyond book/subscription invoices.

Frontend current state:

- All account sections exist.
- Many sections read/write local storage.

Missing work:

- Create an account API module for profile, password, addresses, notifications, newsletter, delete account.
- Replace account dashboard data sources with backend endpoints where available.
- For missing dashboard areas with no backend endpoint, keep the frontend-local source of truth and make the persistence limits clear in code and UX.
- Add loading, empty, error, and retry states for every section.
- Add field-level validation using `react-hook-form` and `zod` where forms still use ad hoc local state.
- Ensure account deletion follows backend impact and confirmation rules.

Acceptance criteria:

- Account data is consistent after login on a different browser.
- Notification count/list/actions are backend-backed.
- Newsletter status uses backend verification and unsubscribe flow.
- Profile/password changes persist through the existing backend profile/password endpoints.

### 10. Search Must Be Frontend Indexed From Available Data

Document requirement:

- Header search leads to the approved search experience.

Frontend current state:

- `search-index.service.ts` builds a local index from frontend data.

Backend current state:

- No search route was found in reviewed API routes.

Missing work:

- Keep search frontend-only because no backend route exists.
- Build the index from available backend APIs where possible and local services where no backend exists.
- Include courses, books, encyclopedia, clinics, consultations, trips, community, podcasts, research, plants/fungi, and legal/help content.
- Add clear no-results behavior and filters by section.

Acceptance criteria:

- Search results reflect current backend content where APIs exist and current local content where frontend-only services are used.
- Results do not link to inactive/deleted/unavailable content.

### 11. Health Assessment Must Remain Frontend-Local

Document requirement:

- Customer health assessment.
- Account health assessment history.
- Admin health assessment sections, conditions/diseases, customer assessment list, detail.

Backend current state:

- No health assessment API or dashboard routes were found in reviewed route files.

Frontend current state:

- Health assessment pages and local services exist.

Missing work:

- Keep health assessment config and submissions in frontend local storage because no backend API can be added.
- Make the customer form, optional prompt, account history, and admin pages match the document as a frontend-local feature.
- Add sensitive medical data handling, privacy messaging, and deletion behavior aligned with account deletion.
- Add form schema validation and field-level errors.
- Clearly disclose in internal docs/copy where needed that records are local until backend support exists.

Acceptance criteria:

- Submitted assessments persist locally on the same device.
- Account history shows local records.
- Admin health assessment UI manages local config/submissions only.

### 12. B3 AI Assistant Must Match Document: Keyword-Based, Not Generative

Document requirement:

- Assistant is manually managed by admin.
- Admin sets welcome message, fallback message, enabled/disabled state.
- Admin manages keywords and one or more text answers.
- User sends text only.
- Assistant picks a matching keyword answer randomly.
- It does not execute platform actions, upload files, use platform content, or save conversations.

Frontend current state:

- `src/app/api/ai/chat/route.ts` uses a Gemini service.
- `src/features/ai-assistant` has local keyword config and admin settings.
- This creates a product mismatch: document says no generative answers and no content search.

Backend current state:

- No assistant API routes were found in reviewed Laravel API routes.
- Next.js admin assistant config is local.

Missing work:

- Disable or remove Gemini generation for document-compliant production mode.
- Implement deterministic keyword matching based on admin config.
- Persist enabled/welcome/fallback/keywords/answers in frontend local storage because no backend route exists.
- Ensure no conversation history is saved.
- Ensure file/image/audio inputs are not accepted.

Acceptance criteria:

- Assistant response is always one of the configured text answers or fallback.
- Admin changes affect user assistant behavior.
- Disabled assistant does not render.

## Medium-Priority Missing Work

### Admin Dashboard Parity

The Next.js admin dashboard currently covers only a simplified subset of the Laravel dashboard. If Next.js is intended to be the production admin, these modules need detailed parity work:

- Admin users, roles, permissions, block/activate/delete behavior.
- Countries.
- FAQs.
- Contact messages.
- Platform reviews approval/rejection.
- Homepage sliders.
- Healing stories.
- Academic specializations.
- General settings, about, terms, privacy.
- Encyclopedia news, news types, editor picks, herbal taxonomy, herbal library.
- Social media.
- Payment methods.
- Client subscriptions and exports.
- Book categories, books, ebook file upload, book buyers, orders, exports.
- Collaboration types and requests.
- Podcast episodes.
- Articles, theories, research, comments.
- Plants/fungi taxonomy and items.
- Newsletter subscribers, campaign send, send log.
- Notifications, broadcast, scheduled notifications, history.

Admin acceptance criteria:

- Every admin table has backend pagination, filters, search, status toggles, create/edit/detail/delete where required.
- Mutations use `SubmitButton`, toasts, confirm dialogs, and field errors per `AGENTS.md`.
- Image/file uploads use the approved upload component and chunked upload endpoint when large files are involved.
- Admin-only access is enforced by the frontend route guards and by any existing backend-protected endpoint that is actually called.

### File Uploads And Media

Missing work:

- Wire image uploads to backend storage for profile avatar, books, courses, clinics, trips, podcast artwork, encyclopedia entries, plants/fungi, homepage sliders.
- Use `@/components/ui/image-upload` in dashboard image flows.
- For large files, wire to `POST /admin/uploads/chunk` or a public API equivalent.
- Add media preview, remove/replace behavior, and validation.

### Internationalization And Arabic Text Integrity

Current issue:

- Several Arabic labels in frontend source render as mojibake, for example strings in `site-layout.tsx` and admin components.

Missing work:

- Fix encoding of Arabic strings.
- Audit all localized files touched by current work.
- Continue using existing `LanguageContext` patterns until formal i18n cleanup starts.
- Ensure RTL layout is tested for header menus, forms, admin tables, account pages, checkout, reader, and chat.

### Payments And Invoices

Missing work:

- Replace `payments-storage.service.ts` with backend payment transaction history where available.
- Add a consistent transaction model across book, subscription, clinic, consultation, package, and trip purchases.
- Handle callback return states.
- Generate/download invoices from backend, not client-only `jspdf`, unless backend has no invoice support.

### Favorites

Missing work:

- Define backend favorite endpoints or mark favorites local-only.
- Persist favorites locally per user unless an existing backend endpoint is confirmed.
- Ensure favorites support all document-required content types: courses, books, encyclopedia/herbs, articles/theories/research if intended, clinics/trips if intended.

## Low-Priority Or Design/QA Missing Work

- Add route-level loading and error boundaries for API-backed pages.
- Add empty states for every list using real backend empty responses.
- Add skeletons for long API loads.
- Add pagination controls for backend-paginated resources.
- Add mobile QA for dropdown navigation, admin drawer, checkout, reader, chat, and account tables.
- Add accessibility pass for dialogs, tabs, dropdowns, forms, and readers.
- Add tests for API mappers, auth flows, pending intent replay, subscription gating, and checkout guards.
- Add feature-level query keys for all new React Query services.
- Remove duplicate legacy modules once API-backed replacements are stable.

## Endpoint Consumption Matrix

| Domain | Backend API Present | Frontend Route Present | Frontend API Integration | Missing Work |
| --- | --- | --- | --- | --- |
| General pages | Yes | Yes | Mostly no | Add general service and replace static content |
| Homepage | Yes | Yes | Mostly no | Use `/user/home`, sliders, selected content |
| Auth | Yes | Yes | No | Replace local auth and OTP |
| Profile/password | Yes | Yes | No | Add account API service |
| Addresses | Yes | Partial | No | Integrate printed book checkout addresses |
| Notifications | Yes | Yes | No | Replace local notification storage |
| Newsletter | Yes | Yes | No | Replace local newsletter storage |
| Books | Yes | Yes | Partial/strong | Fix base path, remove mixed local purchase state |
| Courses | No | Yes | Calls missing API | Remove/guard API calls; use local service or disable transactional actions |
| Subscriptions | Yes | Yes | Partial/strong | Complete checkout/callback/current state |
| Payment methods | Yes | Yes | Partial | Integrate all checkout types |
| Articles/theories | Yes | Yes | Partial | Ensure all pages use API services |
| Research | Yes, gated | Yes | Partial | Enforce backend subscription gating |
| Podcasts | Yes | Yes | Partial | Complete list/detail and request gap |
| Cooperation | Yes | Yes | Partial | Auth, validation, success/error handling |
| Plants/fungi | Yes, gated | Yes | Partial | Complete gated UX and filters |
| Encyclopedia/herbal | Yes | Yes | No/legacy local | Add API services and mappings |
| Clinics | No reviewed API | Yes | Local only | Backend APIs needed |
| Consultations | No reviewed API | Yes | Local only | Backend APIs needed |
| Trips | No reviewed API | Yes | Local only | Backend APIs needed |
| Health assessment | No reviewed API | Yes | Local only | Backend APIs needed |
| AI assistant | No reviewed API | Yes | Local/Gemini mismatch | Keyword backend/config needed |
| Admin dashboard | Laravel Blade routes | Yes subset | Local/prototype | Decide replacement scope and implement APIs |
| Doctor portal | No reviewed API | Yes | Local only | Backend APIs needed |

## Recommended Implementation Order

1. Normalize API base URL, token storage, locale headers, and API error handling.
2. Replace auth/register/OTP/logout/delete-account with Laravel APIs.
3. Integrate general content, homepage, header/footer dynamic data, FAQ/contact/legal pages.
4. Finish books and subscriptions end-to-end because backend APIs already exist.
5. Finish community, podcasts, cooperation, plants/fungi, reviews using existing APIs.
6. Convert courses to a frontend-owned/local-service implementation and remove missing API dependency.
7. Polish care, health assessment, search, favorites, doctor portal, and AI assistant as frontend-owned features with honest persistence/fulfillment states.
8. Replace account dashboard sections with backend-backed services only where existing endpoints are available; keep missing domains local and clearly bounded.
9. Keep Next.js admin as a frontend-managed/prototype admin unless it can call existing backend APIs. Do not claim backend persistence for unsupported modules.
10. Run business-flow QA against the Word document, then i18n/RTL, accessibility, mobile, and test hardening.

## Concrete Frontend Task Checklist

### API Foundation

- [ ] Add `src/features/api` or `src/lib/api` shared client if the team wants to move `apiFetch` out of `society`.
- [ ] Normalize base URL and `/api/v1` prefix.
- [ ] Send auth token and locale headers.
- [ ] Add shared API error to form/toast mapping.
- [ ] Add React Query query keys for every API-backed feature.

### Auth And Account

- [ ] Create auth API service.
- [ ] Replace local login/register.
- [ ] Implement OTP screens for register/reset/email change.
- [ ] Implement backend logout.
- [ ] Implement delete-account impact and delete confirmation.
- [ ] Add profile API service.
- [ ] Add address API service.
- [ ] Add notification API service.
- [ ] Add newsletter account API service.

### Public Site

- [ ] Create general content API service.
- [ ] Create homepage API service.
- [ ] Replace static home content with backend data.
- [ ] Replace static contact/social/footer content.
- [ ] Wire contact form to `POST /general/contact-messages`.
- [ ] Wire FAQ to backend.
- [ ] Fix Arabic mojibake.

### Education And Learning

- [ ] Remove or guard missing course API calls.
- [ ] Use local course services as the frontend source of truth.
- [ ] Gate course checkout as disabled or clearly frontend-local/demo.
- [ ] Keep course progress local and make the UI business-correct.
- [ ] Keep quiz attempts and certificates local and make the UI business-correct.
- [ ] Add encyclopedia/herbal services against existing backend endpoints.
- [ ] Keep monograph favorites local unless an existing backend endpoint is confirmed.

### Books

- [ ] Confirm API path prefix.
- [ ] Use backend data for catalog/detail/account.
- [ ] Implement ebook stream/signed reader.
- [ ] Implement printed order address flow.
- [ ] Replace local purchase storage.
- [ ] Wire invoice download.

### Subscriptions

- [ ] Use backend current subscription for gates.
- [ ] Implement checkout transaction states.
- [ ] Handle callback return.
- [ ] Replace local subscription history.

### Care

- [ ] Keep local care data services and make them match the document.
- [ ] Keep local booking records with honest fulfillment copy.
- [ ] Keep local slot repository and enforce business rules locally.
- [ ] Persist text chat and portal lifecycle locally.
- [ ] Persist doctor portal assignment locally.
- [ ] Disable or reword any action that implies real backend booking/payment where no route exists.

### Community

- [ ] Consolidate legacy and society community modules.
- [ ] Ensure articles/theories/research use backend.
- [ ] Implement auth-required like/comment.
- [ ] Implement subscription-required research UX.
- [ ] Resolve group chat backend gap.
- [ ] Resolve podcast request backend gap.

### Admin

- [ ] Keep Next.js admin frontend-owned unless an existing backend endpoint supports the module.
- [ ] Use existing backend APIs only for modules that expose API routes.
- [ ] Keep local admin services for unsupported modules and label them internally/prototype-safe.
- [ ] Add upload integration only where an existing upload endpoint is available.
- [ ] Add confirmations, toasts, field errors, and loading buttons.

### AI Assistant

- [ ] Remove or disable Gemini for document-compliant assistant mode.
- [ ] Persist assistant config in frontend local storage.
- [ ] Implement keyword matching and random answer selection.
- [ ] Enforce text-only input and no conversation storage.

## Notes And Risks

- The Word document is broader than the current Laravel API. Several frontend pages reflect the document more than the backend does.
- Some backend feature plans exist under `backend/.cursor/plans`, but only registered route files were treated as active backend capability.
- The frontend has a dirty worktree with many existing modifications. This audit file intentionally does not change implementation code.
- The current frontend has duplicate paths for similar domains, especially community/society, books UI/components, courses UI/components, and subscriptions UI/components. Consolidation should happen after API contracts are stable.
