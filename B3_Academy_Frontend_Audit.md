# B3 Academy Frontend Audit

Audit date: 2026-07-08  
Repository: `C:\Users\abdallah\Desktop\ahmed\b3-acadmy`

## Scope And Method

This audit compares three sources in priority order:

1. Business requirements from `B3 Academy new.docx`
2. Backend implementation under `backend/`
3. Current frontend implementation under `src/`

The dashboard/admin-control section of the BRD starts at `لوحة التحكم` and was excluded from this audit as requested. Customer-facing website, commerce, learning, community, account, and self-service journeys were included.

Backend routes were reviewed mainly from:

- `backend/routes/api.php`
- `backend/routes/Api/user.php`
- `backend/routes/Api/general.php`
- Related controllers, requests, resources, and config files for checkout, courses, books, subscriptions, community, collaboration, newsletter, notifications, and profile.

Frontend implementation was reviewed mainly from:

- `src/app/`
- `src/features/`
- `src/components/`
- `src/lib/`

## Backend API Coverage Snapshot

Reviewed customer-facing API groups:

| Domain | Representative Backend Support |
| --- | --- |
| Home/content | `/api/v1/user/home`, `/api/v1/user/sliders`, `/api/v1/user/academic-specializations`, `/api/v1/general/about`, `/api/v1/general/faqs`, `/api/v1/general/contact`, `/api/v1/general/social-media` |
| Auth/account | `/api/v1/user/login`, `/register`, `/logout`, `/profile`, `/profile/password`, `/delete-account/impact`, `/delete-account` |
| Courses | `/api/v1/user/courses`, `/courses/{id}`, `/courses/{id}/checkout-preview`, `/courses/{id}/checkout`, `/my-courses`, lesson, quiz, certificate, and invoice endpoints |
| Books | `/api/v1/user/books`, `/books/{id}`, `/books/{id}/checkout`, `/books/{id}/stream-ebook`, `/my-books`, invoice endpoints |
| Encyclopedia | `/api/v1/user/encyclopedia`, `/news`, `/news/{id}`, `/herbal`, `/herbal/{id}` and taxonomy endpoints |
| Community | `/api/v1/user/podcast`, `/articles`, `/theories`, `/research`, `/group-chat`, `/plants-fungi`, `/collaboration` |
| Subscriptions | `/api/v1/user/subscriptions/plans`, `/plans/{id}`, `/checkout`, `/me`, `/payment-methods` |
| Newsletter | `/api/v1/user/newsletter`, `/subscribe`, `/verify-code`, `/resend-verification`, `DELETE /newsletter` |
| Notifications | `/api/v1/user/notifications`, read, delete, clear, unread count, toggle, read-all, delete-many |
| Payments | `/api/v1/general/payments/callback` |

Major backend gaps found for customer-facing BRD scope:

- Clinics, clinic bookings, doctors, and doctor availability
- Individual consultations, consultation packages, and consultation execution portal
- Trips, initial trip consultations, package fulfillment, and trip capacity
- Health assessment records and results
- B3 AI assistant configuration, keyword answers, and conversation persistence
- Unified customer payment/facture history across all product types
- Favorites
- Global search

---

## Feature 1.1 بداية تجربة العميل داخل موقع العميل

### Business Requirement

The customer should enter a public website, browse available content and services, then sign in or register when a protected action is required.

### Current Frontend

The public shell, home page, navigation, public catalog pages, auth pages, and protected-action prompts exist. The implementation mixes backend-backed state with local demo state, especially through `AuthProvider`, local storage services, and checkout/account fallbacks.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/home` | Home-page public data |
| GET | `/api/v1/user/sliders` | Public sliders |
| GET | `/api/v1/user/courses` | Public course catalog |
| GET | `/api/v1/user/books` | Public book catalog |
| POST | `/api/v1/user/login` | Customer login |
| POST | `/api/v1/user/register` | Customer registration |

### Findings

- **Partially Implemented:** Public browsing exists across several domains.
- **Mismatch:** Protected-action behavior is inconsistent. Some areas show auth prompts, while others call protected APIs before the user is authenticated.
- **Business Logic Issue:** Local demo login and local checkout records can make the frontend appear functional even where backend production flows do not exist.
- **UI Issue:** Many Arabic labels render as mojibake in source and UI strings, especially navigation, home, auth, checkout, and account flows.

### Severity

High

### Recommendation

Make backend authentication and backend-owned customer state the only production source of truth. Disable demo fallbacks outside explicit development mode, normalize auth gates before protected API calls, and fix Arabic encoding across customer-facing strings.

### Files

- `src/features/auth/auth-provider.tsx`
- `src/features/navigation/components/site-layout.tsx`
- `src/features/site-content/components/home-page.tsx`
- `src/lib/api/base-fetch.ts`

---

## Feature 1.2 الصفحة الرئيسية لموقع العميل

### Business Requirement

The home page should present the B3 Academy brand, selected courses/books, customer content sections, healing stories/testimonials, subscriptions, and clear navigation without unrelated advertising.

### Current Frontend

The home page exists and fetches some backend content. Featured courses and books are API-backed. Other areas remain static or local, including hero media, subscription cards, testimonials/healing stories, and newsletter submission.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/home` | Public home data |
| GET | `/api/v1/user/sliders` | Admin-managed sliders |
| GET | `/api/v1/user/academic-specializations` | Specialization content |
| GET | `/api/v1/user/courses/featured` | Featured courses |
| GET | `/api/v1/user/books/featured` | Featured books |
| GET | `/api/v1/user/subscriptions/plans` | Subscription plans |
| GET | `/api/v1/general/faqs` | FAQs |

### Findings

- **Partially Implemented:** Featured courses/books are fetched from the backend.
- **Backend Feature Not Used:** Slider data is fetched by service code but not fully used as the primary hero/slider experience.
- **Mismatch:** Home subscriptions use static cards instead of backend plans in the main marketing section.
- **Missing:** Healing stories/testimonials appear local/static rather than backend-controlled.
- **UI Issue:** Arabic text corruption is visible in home-page strings.

### Severity

Medium

### Recommendation

Bind home sections to the backend home/sliders/plans/content APIs. Keep static fallbacks only for local development and display clean loading, empty, and error states.

### Files

- `src/features/site-content/components/home-page.tsx`
- `src/features/site-content/services/site-content-api.service.ts`
- `src/features/subscriptions/services/subscriptions-api.service.ts`

---

## Feature 1.3 الهيدر

### Business Requirement

The header should expose the main customer navigation: learning, care services, community, subscriptions, search, account/login, and language/brand access.

### Current Frontend

The header exists with dropdowns for education and care, direct links for community, subscriptions, ratings, search, and account/auth actions. It uses static route definitions and hardcoded labels.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/general/social-media` | Social links if header needs them |
| GET | `/api/v1/general/contact` | Contact configuration if header needs it |
| POST | `/api/v1/general/change-lang` | Language change endpoint |

### Findings

- **Partially Implemented:** Main navigation structure exists.
- **UI Issue:** Header labels contain Arabic mojibake.
- **Missing:** Plant/fungi community content is not surfaced clearly from the primary community navigation.
- **Mismatch:** Language change is mostly frontend-context driven and not visibly synchronized with backend `/change-lang`.

### Severity

Medium

### Recommendation

Repair encoded Arabic labels, add all customer-facing BRD destinations to the primary or secondary navigation, and connect language preference to the backend where required.

### Files

- `src/features/navigation/components/site-layout.tsx`
- `src/lib/routing/routes.ts`

---

## Feature 1.4 الفوتر

### Business Requirement

The footer should provide brand information, links, contact details, social links, legal pages, and newsletter subscription.

### Current Frontend

The footer exists, but contact/social values are static. Newsletter submission uses local storage and pending-intent login behavior rather than the backend newsletter workflow.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/general/contact` | Contact details |
| GET | `/api/v1/general/social-media` | Social links |
| GET | `/api/v1/general/about` | About page |
| GET | `/api/v1/general/terms` | Terms page |
| GET | `/api/v1/general/privacy` | Privacy page |
| POST | `/api/v1/user/newsletter/subscribe` | Newsletter subscription |

### Findings

- **Partially Implemented:** Footer layout and links exist.
- **Backend Feature Not Used:** Contact and social endpoints are not the footer source of truth.
- **Mismatch:** Newsletter behavior is local and auth-pending, while backend provides a newsletter API.
- **UI Issue:** Footer Arabic strings are corrupted.

### Severity

Medium

### Recommendation

Use backend contact/social/legal/newsletter APIs. Remove local newsletter persistence from production and show backend validation and verification states.

### Files

- `src/features/navigation/components/site-layout.tsx`
- `src/features/site-content/services/site-content-api.service.ts`
- `src/features/account/hooks/use-account-api.ts`

---

## Feature 1.5 الزائر

### Business Requirement

Visitors can browse public content and should be prompted to sign in/register for protected actions such as purchase, enrollment, review submission, collaboration, subscriptions, and private community features.

### Current Frontend

Visitor browsing exists, but protected gates are uneven. Several protected features call APIs before checking auth/subscription. Some purchases and records are created locally after login.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| Public GET | `/api/v1/user/courses`, `/books`, `/articles`, `/theories`, `/podcast` | Public browsing |
| Auth POST | `/api/v1/user/courses/{id}/checkout` | Protected enrollment |
| Auth POST | `/api/v1/user/books/{id}/checkout` | Protected purchase |
| Auth POST | `/api/v1/user/subscriptions/checkout` | Protected subscription checkout |
| Auth GET/POST | `/api/v1/user/group-chat/*`, `/research/*`, `/plants-fungi/*` | Subscription-protected features |

### Findings

- **Partially Implemented:** Visitor-to-auth handoff exists in several flows.
- **Permission Issue:** Research, plant/fungi, and collaboration pages can call protected APIs before a clean auth/subscription gate.
- **Business Logic Issue:** Local demo state can satisfy gates that the backend would reject.
- **Incorrect:** Some protected errors are shown as empty content or not-found states.

### Severity

High

### Recommendation

Centralize protected-action gating. Do not mount protected queries until auth/subscription prerequisites are known. Map backend `401`, `403`, and subscription-required errors to explicit user-facing states.

### Files

- `src/features/auth/components/auth-action-gate.tsx`
- `src/features/community/components/community-home-page.tsx`
- `src/features/society/plants-fungi/PlantFungiPage.tsx`
- `src/features/society/community-posts/CommunityPostListPage.tsx`
- `src/features/society/cooperation/CooperationPage.tsx`

---

## Feature 1.6 التسجيل وتسجيل الدخول

### Business Requirement

Customers must be able to register, verify codes, log in, recover passwords, and manage secure authenticated access.

### Current Frontend

Auth screens exist. Login is backend-first but falls back to local demo accounts on API failure. Registration uses frontend OTP behavior and does not reliably persist the backend token. Password reset uses local storage helpers instead of backend reset APIs.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/user/login` | Login |
| POST | `/api/v1/user/register` | Registration |
| POST | `/api/v1/user/verify-code` | Verification |
| POST | `/api/v1/user/resend-code` | Resend code |
| POST | `/api/v1/user/forgot-password` | Start reset |
| POST | `/api/v1/user/forgot-password/send-code` | Send reset code |
| POST | `/api/v1/user/forgot-password/verify-code` | Verify reset code |
| POST | `/api/v1/user/reset-password` | Reset password |
| POST | `/api/v1/user/logout` | Logout |

### Findings

- **Incorrect:** Backend failures can silently fall back to local auth, masking real production failures.
- **Mismatch:** Registration response mapping does not consistently store the backend token.
- **Backend Feature Not Used:** Password reset and OTP flows rely on local/mock utilities in important paths.
- **Validation Missing:** Auth forms do not consistently use `react-hook-form`, `zod`, and field-level `FormFieldError` conventions.
- **UI Issue:** Arabic labels and messages are corrupted.

### Severity

Critical

### Recommendation

Remove local auth fallback from production, wire all OTP and password reset steps to backend endpoints, store backend tokens consistently, and convert forms to shared validation/error patterns.

### Files

- `src/features/auth/auth-provider.tsx`
- `src/features/auth/services/auth-api.service.ts`
- `src/features/auth/components/auth-page.tsx`
- `src/features/auth/services/auth-storage.service.ts`

---

## Feature 1.7 البحث

### Business Requirement

Customers should search website content and discover relevant courses, books, articles, theories, encyclopedia items, and other public content.

### Current Frontend

Search is implemented as a frontend local index. There is no global backend search endpoint. Results may not reflect current backend content, permissions, availability, or active status.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | Various catalog endpoints with filters | Domain-specific search/filtering only |

### Findings

- **Missing:** No backend global search API exists.
- **Mismatch:** Frontend search depends on local/static indexing instead of live backend data.
- **Business Logic Issue:** Search can surface content that may not be active, purchasable, or accessible according to backend rules.

### Severity

High

### Recommendation

Add a backend global search endpoint or federated search service. Until then, scope frontend search to backend-backed domain queries and clearly handle unavailable/protected results.

### Files

- `src/features/search/services/search-index.service.ts`
- `src/features/search/components/search-page.tsx`

---

## Feature 1.8 قسم التعليم والتعلم

### Business Requirement

Learning should group courses, books, and encyclopedia content into a coherent education area.

### Current Frontend

Education entry pages and navigation exist. Course and book lists are backend-backed. Encyclopedia support exists through dedicated services/components. The landing content is partially static and not fully composed from backend-managed education data.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/courses` | Courses |
| GET | `/api/v1/user/books` | Books |
| GET | `/api/v1/user/encyclopedia` | Encyclopedia |
| GET | `/api/v1/user/news` | Encyclopedia/news items |
| GET | `/api/v1/user/herbal` | Herbal encyclopedia |

### Findings

- **Partially Implemented:** Education domains are represented.
- **Mismatch:** Education overview content is not fully backend-managed.
- **UI Issue:** Labels and descriptions need encoding cleanup.

### Severity

Medium

### Recommendation

Use backend-driven counts/featured items/categories for the education overview and ensure all education cards link to backend-backed list/detail pages.

### Files

- `src/features/education/`
- `src/features/courses/`
- `src/features/books/`
- `src/features/library/`

---

## Feature 1.8.1 صفحة الدورات

### Business Requirement

Customers should browse courses, filter/search by category and level, view featured courses, and reach course details.

### Current Frontend

Course catalog is API-backed and supports search/filter UI. It does not expose backend pagination metadata and does not render real pagination. Several strings are corrupted.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/courses/categories` | Course categories |
| GET | `/api/v1/user/courses/levels` | Course levels |
| GET | `/api/v1/user/courses/featured` | Featured courses |
| GET | `/api/v1/user/courses` | Paginated/filterable courses |

### Findings

- **Partially Implemented:** API-backed course listing and filters exist.
- **Backend Feature Not Used:** Pagination metadata is discarded in frontend service mapping.
- **UI Issue:** No robust pagination controls; Arabic copy is corrupted.
- **Mismatch:** Frontend sends a `limit` to featured courses, but backend does not consume that parameter; frontend slices locally.

### Severity

Medium

### Recommendation

Preserve pagination metadata in service responses, add pagination controls, and repair localized strings.

### Files

- `src/features/courses/services/courses-api.service.ts`
- `src/features/courses/ui/CourseCatalogPage.tsx`

---

## Feature 1.8.2 تفاصيل الدورة

### Business Requirement

Course details should show full course information, curriculum, pricing/payment mode, instructor, access status, and a clear enrollment path.

### Current Frontend

Course detail is API-backed and displays curriculum and checkout actions. Access flags from the backend are not consistently enforced in the curriculum UI.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/courses/{id}` | Public course details and curriculum outline |
| GET | `/api/v1/user/courses/{id}/checkout-preview` | Authenticated payment/access preview |

### Findings

- **Partially Implemented:** Backend detail data is used.
- **Business Logic Issue:** Curriculum locks rely on frontend `isLocked` assumptions while backend returns `is_accessible`, `is_paid`, and related access flags.
- **Mismatch:** Favorites are local only and not backed by a backend endpoint.
- **UI Issue:** Some course copy is corrupted.

### Severity

High

### Recommendation

Map and enforce backend access flags exactly. Distinguish public curriculum preview from enrolled/paid section access and remove local-only favorite assumptions or add a backend favorite API.

### Files

- `src/features/courses/ui/CourseDetailView.tsx`
- `src/features/courses/services/courses-api.service.ts`

---

## Feature 1.8.3 التسجيل في الدورة والدفع

### Business Requirement

Customers should enroll in a course, optionally pay by section when allowed, select a payment method/currency, and complete backend payment/order flow.

### Current Frontend

Course checkout uses backend detail, checkout preview, payment methods, and checkout APIs. Section selection and checkout state need tighter backend rule alignment.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/courses/{id}/checkout-preview` | Checkout pricing and section preview |
| POST | `/api/v1/user/courses/{id}/checkout` | Create course checkout |
| GET | `/api/v1/user/payment-methods` | Active payment methods |
| GET/POST | `/api/v1/general/payments/callback` | Payment callback |

### Findings

- **Partially Implemented:** Backend course checkout is wired.
- **Business Logic Issue:** Section dropdown can default to a section rather than requiring explicit valid selection.
- **Mismatch:** Frontend disabled state does not fully mirror backend `CheckoutCourseRequest` rules for next payable/accessibility.
- **Missing:** Payment callback/success lifecycle is not exposed as a clear customer-facing order status flow.

### Severity

High

### Recommendation

Use checkout preview flags as the single source for payable section options. Require explicit valid user selection for section payments and add a backend-driven success/status screen after payment.

### Files

- `src/features/courses/ui/CourseCheckoutPage.tsx`
- `backend/app/Http/Requests/Api/User/Course/CheckoutCourseRequest.php`

---

## Feature 1.8.4 متابعة محتوى الدورة

### Business Requirement

Enrolled customers should access paid lessons, progress through content, complete lessons, and respect sequential or payment-based restrictions.

### Current Frontend

The course player uses backend my-course detail, lesson, completion, and quiz endpoints. It does not consistently block inaccessible lessons and has quiz lesson ID mapping issues.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/my-courses/{id}` | Enrolled course detail |
| GET | `/api/v1/user/my-courses/{course}/lessons/{lesson}` | Lesson content with access assertion |
| POST | `/api/v1/user/my-courses/{course}/lessons/{lesson}/complete` | Mark lesson complete |

### Findings

- **Partially Implemented:** Core learning endpoints are used.
- **Permission Issue:** UI clickability does not consistently respect backend `is_accessible === false`.
- **Incorrect:** Quiz lessons in my-course detail do not include `course_quiz_id`; the player can call quiz endpoints with a lesson ID.
- **Business Logic Issue:** Inline query keys bypass the repo convention that feature-owned query keys should be centralized.

### Severity

High

### Recommendation

Fetch lesson detail before starting lesson-level quizzes so the real `course_quiz_id` is available. Disable inaccessible lessons in the UI and move query keys into a course/learning query key module.

### Files

- `src/features/learning/components/course-player.tsx`
- `src/features/courses/services/courses-api.service.ts`
- `backend/app/Http/Resources/Api/User/Course/MyCourseDetailResource.php`
- `backend/app/Http/Resources/Api/User/Course/CourseLessonResource.php`

---

## Feature 1.8.5 الاختبارات داخل الدورة

### Business Requirement

Customers should take lesson/final quizzes, submit valid answers, and see pass/fail outcomes without exposing correct answers.

### Current Frontend

Quiz start and submit endpoints are wired. Final quiz and lesson quiz access logic is incomplete, and validation feedback is not aligned with shared form/error conventions.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/my-courses/{course}/quizzes/{quiz}` | Start/get quiz |
| POST | `/api/v1/user/my-courses/{course}/quizzes/{quiz}/submit` | Submit quiz answers |

### Findings

- **Partially Implemented:** Quiz API calls exist and backend does not expose correct answers.
- **Incorrect:** Lesson quiz ID mapping can be wrong.
- **Permission Issue:** Final quiz action can appear even when backend marks it inaccessible.
- **Validation Missing:** Missing answers trigger a success toast instead of an error/field-level validation state.
- **Mismatch:** Backend requires every question to have exactly one valid choice; frontend validation should mirror this before submit.

### Severity

High

### Recommendation

Respect final quiz `is_accessible`, fix lesson quiz ID resolution, and validate the answer map before submit with error toasts/field indicators.

### Files

- `src/features/learning/components/course-player.tsx`
- `backend/app/Http/Requests/Api/User/Course/SubmitCourseQuizRequest.php`

---

## Feature 1.8.6 إكمال الدورة والشهادة

### Business Requirement

After completing a course and passing requirements, customers should receive or download their certificate.

### Current Frontend

Certificate download calls exist. The player and account areas do not consistently hide or disable certificate actions when the backend has not issued/enabled a certificate.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/my-courses/{course}/certificate` | Download certificate PDF when issued |
| GET | `/api/v1/user/my-courses/{course}` | Course completion/certificate status |

### Findings

- **Partially Implemented:** Certificate endpoint is wired.
- **Business Logic Issue:** Certificate action can be shown before backend issuance.
- **UI Issue:** Certificate download errors are not turned into a helpful completion/pending state.

### Severity

Medium

### Recommendation

Only show certificate actions when backend status indicates issuance. Convert backend certificate errors into clear pending/not-eligible UI.

### Files

- `src/features/learning/components/course-player.tsx`
- `src/features/account/components/courses-page.tsx`

---

## Feature 1.8.7 صفحة الكتب

### Business Requirement

Customers should browse books, filter by category/format, search, and open book details.

### Current Frontend

Book catalog is backend-backed, but categories and pagination are not fully used. Filtering and sorting are partly client-side on the currently loaded results.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/books/categories` | Book categories |
| GET | `/api/v1/user/books/featured` | Featured books |
| GET | `/api/v1/user/books` | Paginated/filterable books |

### Findings

- **Partially Implemented:** Book list API is used.
- **Backend Feature Not Used:** Category endpoint is not consistently used for filter options.
- **Mismatch:** Client-side filtering on a partial page can produce inaccurate results.
- **Missing:** Pagination metadata and controls are absent.

### Severity

Medium

### Recommendation

Use backend category and pagination metadata directly. Move filters/sort/search into backend query parameters where supported.

### Files

- `src/features/books/ui/BookCatalogPage.tsx`
- `src/features/books/services/books-api.service.ts`

---

## Feature 1.8.8 تفاصيل الكتاب

### Business Requirement

Book details should show book information, formats, pricing, availability, and purchase/read options.

### Current Frontend

Book details are generally API-backed. Favorites and some reader/purchase assumptions remain local.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/books/{id}` | Book detail |
| GET | `/api/v1/user/books/{id}/stream-ebook` | Ebook stream |

### Findings

- **Partially Implemented:** Backend detail endpoint is used.
- **Mismatch:** Favorites are local only.
- **Business Logic Issue:** Reader access is not consistently based on backend ownership.
- **UI Issue:** Some localized strings are corrupted.

### Severity

Medium

### Recommendation

Use backend ownership/my-books data for read actions and add or remove favorites depending on backend scope.

### Files

- `src/features/books/`
- `src/features/books/components/book-reader.tsx`

---

## Feature 1.8.9 شراء الكتاب

### Business Requirement

Customers should buy digital, printed, or bundled books using supported payment methods, currencies, and address information where needed.

### Current Frontend

Book checkout uses backend book detail, payment methods, and checkout endpoints. Address and currency handling do not match backend validation.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/user/books/{id}/checkout` | Create book checkout |
| GET | `/api/v1/user/payment-methods` | Active payment methods |
| GET | `/api/v1/user/addresses` | Customer addresses |
| POST | `/api/v1/user/addresses` | Create address |
| GET/POST | `/api/v1/general/payments/callback` | Payment callback |

### Findings

- **Partially Implemented:** Backend checkout endpoint is used.
- **Incorrect:** Currency options include `GBP`, which backend config does not support, and omit `SAR`.
- **Backend Feature Not Used:** Address selector uses local `user.addresses` instead of backend address endpoints or nested address payload support.
- **Validation Missing:** Printed/bundled book address validation does not fully mirror `CheckoutBookRequest`.
- **Missing:** Payment callback/order status handling is incomplete.

### Severity

High

### Recommendation

Use backend-supported currencies from config/API, wire address selection/creation to backend address endpoints, and validate required address rules before submit.

### Files

- `src/features/books/ui/BookCheckoutPage.tsx`
- `src/features/books/services/books-api.service.ts`
- `backend/config/currency.php`
- `backend/app/Http/Requests/Api/User/Book/CheckoutBookRequest.php`

---

## Feature 1.8.10 قراءة الكتاب الإلكتروني

### Business Requirement

Customers who bought an ebook should be able to read it securely with access control and copy-protection/watermark behavior where required.

### Current Frontend

The reader starts from local book/content ownership checks and then attempts backend streaming. Backend-only numeric book IDs can fail local lookup before stream access. The stream is embedded in a way that may not include auth headers.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/books/{id}/stream-ebook` | Stream ebook |
| GET | `/api/v1/user/my-books` | Owned books |
| GET | `/api/v1/user/my-books/{id}` | Owned book detail |

### Findings

- **Incorrect:** Reader can reject a backend-owned book because it is missing from local mock data.
- **Permission Issue:** Raw iframe/URL streaming may not send `Authorization`, depending on browser request path.
- **Mismatch:** Ownership is checked locally instead of via backend `my-books`.
- **Business Logic Issue:** Invoice URL building in the book service omits normalized `/api/v1` behavior in at least one path.

### Severity

High

### Recommendation

Resolve ownership and read URLs from `/my-books`. Use authenticated file download/stream helpers or signed backend URLs. Remove local reader gate for production backend records.

### Files

- `src/features/books/components/book-reader.tsx`
- `src/features/books/services/books-api.service.ts`

---

## Feature 1.8.11 صفحة الموسوعة

### Business Requirement

Customers should browse encyclopedia content, including news/encyclopedia entries and herbal taxonomy where applicable.

### Current Frontend

Encyclopedia services and pages exist and call backend encyclopedia/news/herbal endpoints. Filtering and pagination need verification and stronger UI treatment.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/encyclopedia` | Encyclopedia list |
| GET | `/api/v1/user/encyclopedia/news-types` | News types |
| GET | `/api/v1/user/news` | News list |
| GET | `/api/v1/user/herbal/families` | Herbal families |
| GET | `/api/v1/user/herbal/species` | Herbal species |
| GET | `/api/v1/user/herbal/genera` | Herbal genera |
| GET | `/api/v1/user/herbal/origins` | Herbal origins |
| GET | `/api/v1/user/herbal` | Herbal list |

### Findings

- **Partially Implemented:** Backend encyclopedia APIs are represented.
- **Backend Feature Not Used:** Taxonomy filters are not clearly exposed as full backend-driven filters throughout the UI.
- **Missing:** Pagination metadata handling is not consistently visible.
- **UI Issue:** Empty/error states need clearer backend-aware messaging.

### Severity

Medium

### Recommendation

Expose backend taxonomy filters and pagination in the encyclopedia UI, and normalize empty/error states for inactive or missing content.

### Files

- `src/features/library/services/encyclopedia-api.service.ts`
- `src/features/library/`

---

## Feature 1.8.12 تفاصيل عنصر داخل الموسوعة

### Business Requirement

Customers should open a single encyclopedia/news/herbal item and view complete details.

### Current Frontend

Detail pages/services exist for encyclopedia-related content. Some access/favorite assumptions are frontend-only.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/news/{id}` | News detail |
| GET | `/api/v1/user/herbal/{id}` | Herbal detail |

### Findings

- **Partially Implemented:** Backend detail endpoints are available to frontend code.
- **Mismatch:** Favorite/save behavior is local where present.
- **UI Issue:** Detail error states should distinguish missing, inactive, and network failure.

### Severity

Medium

### Recommendation

Keep detail rendering backend-first, add explicit unavailable states, and avoid local-only saved/favorite claims unless backend support is added.

### Files

- `src/features/library/`
- `src/features/library/services/encyclopedia-api.service.ts`

---

## Feature 1.9.1 صفحة العيادات

### Business Requirement

Customers should browse clinics, see available specialties/services, and enter clinic booking flows.

### Current Frontend

Clinic pages exist using local/static care data and local storage. No backend clinic API exists.

### Backend Support

No customer-facing clinic routes, controllers, or models were found for this requirement.

### Findings

- **Backend Feature Missing:** No backend clinic catalog exists.
- **Partially Implemented:** Frontend UI exists but is non-production/local.
- **Business Logic Issue:** Availability, service definitions, and booking state are local and cannot be administered reliably.

### Severity

High

### Recommendation

Add backend clinic/specialty/service APIs, then replace local care data with backend queries and protected booking mutations.

### Files

- `src/features/care/services/care-data.service.ts`
- `src/features/care/components/ClinicPage.tsx`

---

## Feature 1.9.2 تفاصيل العيادة

### Business Requirement

Customers should view clinic details, doctors, services, prices, availability, and booking actions.

### Current Frontend

Clinic detail content is derived from local care data. Doctor/service availability is not backend-backed.

### Backend Support

No backend clinic detail or doctor availability endpoint was found.

### Findings

- **Backend Feature Missing:** Clinic detail and availability are absent from backend.
- **Mismatch:** Frontend displays details that cannot be validated or fulfilled by backend.
- **Business Logic Issue:** Prices and appointment options are local and can diverge from business reality.

### Severity

High

### Recommendation

Create backend clinic detail, doctor, service, schedule, and pricing endpoints before treating this flow as production-ready.

### Files

- `src/features/care/components/ClinicPage.tsx`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.9.3 حجز موعد عيادة

### Business Requirement

Customers should book clinic appointments with a doctor/service, date/time, payment if required, and backend confirmation.

### Current Frontend

The booking flow exists, but appointments are local records. Checkout for clinic-related flows goes through generic local checkout, not a backend booking/payment API.

### Backend Support

No backend clinic booking or appointment payment endpoint was found.

### Findings

- **Backend Feature Missing:** No booking mutation exists.
- **Incorrect:** Frontend can create local bookings that backend does not know about.
- **Business Logic Issue:** Slot availability, conflicts, cancellation, confirmation, and invoices are local only.

### Severity

Critical

### Recommendation

Implement backend appointment booking, slot locking, payment/order creation, and booking status APIs. Disable production clinic booking until backend support exists.

### Files

- `src/features/care/components/BookingFlow.tsx`
- `src/features/checkout/components/checkout-page.tsx`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.9.4 صفحة الاستشارات

### Business Requirement

Customers should browse consultation services and available consultation options.

### Current Frontend

Consultation pages exist and use local care data. No backend consultation catalog exists.

### Backend Support

No consultation catalog routes were found.

### Findings

- **Backend Feature Missing:** No backend consultation definitions/packages.
- **Partially Implemented:** Frontend displays static/local consultation content.
- **Mismatch:** Presented services cannot be purchased or executed through backend.

### Severity

High

### Recommendation

Add consultation service/package APIs and replace local data with backend queries.

### Files

- `src/features/care/`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.9.5 حجز الاستشارة الفردية

### Business Requirement

Customers should book a single consultation, select time/method, pay, and receive a confirmed execution path.

### Current Frontend

Individual consultation booking is local. Meeting/execution information is generated in the frontend and stored locally.

### Backend Support

No individual consultation booking or execution routes were found.

### Findings

- **Backend Feature Missing:** No backend booking/order/execution flow.
- **Incorrect:** Frontend-generated consultation records are not authoritative.
- **Business Logic Issue:** Appointment capacity, doctor assignment, payment confirmation, and session status are local.

### Severity

Critical

### Recommendation

Build backend consultation booking and lifecycle APIs before enabling this flow. Frontend should only show confirmed backend sessions.

### Files

- `src/features/care/components/BookingFlow.tsx`
- `src/features/care/services/care-data.service.ts`
- `src/features/checkout/components/checkout-page.tsx`

---

## Feature 1.9.6 حجز وشراء باقة استشارات

### Business Requirement

Customers should buy consultation packages and consume included sessions according to package rules.

### Current Frontend

Consultation packages are local/static. Purchases are local records created by generic checkout.

### Backend Support

No backend consultation package purchase routes were found.

### Findings

- **Backend Feature Missing:** No consultation package/order/session balance model.
- **Incorrect:** Package entitlements are local and cannot be enforced across devices.
- **Business Logic Issue:** Remaining sessions, expiry, refunds, and invoices are not backend-backed.

### Severity

Critical

### Recommendation

Add backend package, purchase, session-balance, and fulfillment endpoints. Replace local package state with backend entitlements.

### Files

- `src/features/care/services/care-data.service.ts`
- `src/features/account/components/consultations-page.tsx`
- `src/features/checkout/components/checkout-page.tsx`

---

## Feature 1.9.7 بوابة تنفيذ الاستشارة

### Business Requirement

Customers and providers should execute consultations through a portal that supports session status, chat/video/text execution, notes, and completion.

### Current Frontend

Consultation execution/chat UI exists but is local/fake. Meeting URLs and messages are not backend-backed.

### Backend Support

No consultation execution, chat, meeting, or provider portal API was found.

### Findings

- **Backend Feature Missing:** No session execution backend.
- **Incorrect:** Frontend execution state is not authoritative.
- **Business Logic Issue:** No secure session access, audit trail, provider assignment, or completion workflow.

### Severity

Critical

### Recommendation

Create backend session execution APIs, secure room/token handling, provider/customer role checks, message persistence, and session status transitions.

### Files

- `src/features/care/`
- `src/features/account/components/consultations-page.tsx`

---

## Feature 1.9.8 صفحة الرحلات

### Business Requirement

Customers should browse available trips and trip packages.

### Current Frontend

Trips are displayed from local/static care data. No backend trip catalog exists.

### Backend Support

No trip catalog routes were found.

### Findings

- **Backend Feature Missing:** No backend trips/packages.
- **Partially Implemented:** Frontend trip UI exists but is local only.
- **Mismatch:** Trip capacity and availability cannot be trusted.

### Severity

High

### Recommendation

Add backend trip/package APIs with availability and pricing, then bind the trip pages to those endpoints.

### Files

- `src/features/care/components/TripsPage.tsx`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.9.9 تفاصيل باقة الرحلة

### Business Requirement

Customers should view trip package details, dates, capacity, inclusions, pricing, and prerequisites.

### Current Frontend

Trip detail/package information is local. Prerequisite logic is implemented locally.

### Backend Support

No trip detail or prerequisite endpoint was found.

### Findings

- **Backend Feature Missing:** No trip package detail source.
- **Business Logic Issue:** Capacity and prerequisite rules are local and can be bypassed.
- **Mismatch:** Displayed trip data has no backend fulfillment path.

### Severity

High

### Recommendation

Move trip package details, capacity, prerequisites, and booking rules into backend APIs.

### Files

- `src/features/care/components/TripsPage.tsx`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.9.10 شراء باقة الرحلة

### Business Requirement

Customers should buy trip packages with payment, backend confirmation, invoices, and capacity enforcement.

### Current Frontend

Trip purchase uses local generic checkout and local trip purchase records.

### Backend Support

No backend trip checkout endpoint was found.

### Findings

- **Backend Feature Missing:** No trip order/payment API.
- **Incorrect:** Frontend can create local trip purchases without backend payment/order confirmation.
- **Business Logic Issue:** Capacity, payment, cancellation, and invoice state are local.

### Severity

Critical

### Recommendation

Implement backend trip checkout, capacity locking, payment callback handling, and purchase status APIs. Disable or clearly mark local-only trip checkout in production.

### Files

- `src/features/care/components/TripsPage.tsx`
- `src/features/checkout/components/checkout-page.tsx`
- `src/features/account/components/trips-page.tsx`

---

## Feature 1.9.11 حجز وتنفيذ الاستشارة الأولية للعيادة

### Business Requirement

Customers should book and complete an initial clinic consultation as part of the clinic journey.

### Current Frontend

Initial clinic consultation logic exists locally as part of care booking/prerequisite flows.

### Backend Support

No backend initial clinic consultation endpoints were found.

### Findings

- **Backend Feature Missing:** No backend initial consultation booking/execution lifecycle.
- **Incorrect:** Completion/prerequisite status can be represented locally only.
- **Business Logic Issue:** Backend cannot enforce clinic progression based on local consultation state.

### Severity

Critical

### Recommendation

Add backend initial consultation lifecycle APIs and use them as prerequisites for clinic flows.

### Files

- `src/features/care/components/BookingFlow.tsx`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.9.12 حجز وتنفيذ الاستشارة الأولية العامة للرحلات

### Business Requirement

Customers should book and complete an initial general consultation before trip purchase/execution where required.

### Current Frontend

Trip prerequisite consultation logic exists locally.

### Backend Support

No backend initial trip consultation endpoint was found.

### Findings

- **Backend Feature Missing:** No backend prerequisite consultation workflow for trips.
- **Business Logic Issue:** Trip eligibility is local and cannot be enforced by backend checkout.
- **Mismatch:** Trip purchase can appear valid in frontend without backend confirmation.

### Severity

Critical

### Recommendation

Add backend trip prerequisite consultation APIs and enforce eligibility server-side during trip checkout.

### Files

- `src/features/care/components/TripsPage.tsx`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.10 صفحة المجتمع

### Business Requirement

Community should expose chat, podcasts, articles, theories, research, collaboration requests, and plant/fungi encyclopedia areas.

### Current Frontend

Community home exists with local/static section definitions. It links to several community areas but does not clearly surface plant/fungi content, and subscription checks are local in parts of the UI.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/podcast` | Podcasts |
| GET | `/api/v1/user/articles` | Articles |
| GET | `/api/v1/user/theories` | Theories |
| GET | `/api/v1/user/research` | Research, subscription required |
| GET/POST | `/api/v1/user/group-chat/*` | Group chat, subscription required |
| GET | `/api/v1/user/plants-fungi` | Plants/fungi, subscription required |
| GET/POST | `/api/v1/user/collaboration/*` | Collaboration requests, auth required |

### Findings

- **Partially Implemented:** Community landing and several domain pages exist.
- **Missing:** Plant/fungi is not clearly represented in the community landing structure.
- **Business Logic Issue:** Local subscription checks can diverge from backend `/subscriptions/me`.
- **UI Issue:** Arabic copy is corrupted in multiple community components.

### Severity

High

### Recommendation

Make community sections backend-aware, include all BRD destinations, and use backend current subscription state for protected community areas.

### Files

- `src/features/community/components/community-home-page.tsx`
- `src/features/community/services/community-sections.service.ts`
- `src/features/subscriptions/services/subscriptions-api.service.ts`

---

## Feature 1.10.1 المحادثة الجماعية للمشتركين

### Business Requirement

Subscribed customers should access a group chat room, view messages, and send messages if permitted.

### Current Frontend

Group chat uses backend current-room/messages/send APIs. It polls messages and renders a chat UI. Error states and ownership display are incomplete.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/group-chat/current-room` | Current subscriber room |
| GET | `/api/v1/user/group-chat/messages` | Paginated messages |
| POST | `/api/v1/user/group-chat/messages` | Send message |

### Findings

- **Partially Implemented:** Core chat endpoints are used.
- **Incorrect:** Service includes fallback to `/group-chat/room`, which is not a defined backend route.
- **Permission Issue:** All chat errors are treated like subscription-required errors.
- **UI Issue:** Backend resource does not provide `is_own_message`, so frontend alignment can be misleading.
- **Missing:** No real-time transport; polling only.

### Severity

High

### Recommendation

Remove non-existent fallback route, map backend errors precisely, add sender identity or `is_own_message` support, and consider WebSocket/broadcast support if real-time chat is required.

### Files

- `src/features/community/components/community-chat.tsx`
- `src/features/community/services/group-chat-api.service.ts`
- `backend/app/Http/Resources/Api/User/GroupChat/RoomMessageResource.php`

---

## Feature 1.10.2 البودكاست

### Business Requirement

Customers should browse and play podcasts, with background playback behavior.

### Current Frontend

Podcast list/detail/player functionality exists and uses backend podcast endpoints in the society feature. Some legacy mock podcast service remains elsewhere.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/podcast` | Podcast list |
| GET | `/api/v1/user/podcast/{id}` | Podcast detail |

### Findings

- **Partially Implemented:** Backend podcast APIs are used.
- **Backend Feature Not Used:** Search/pagination support in service is not fully surfaced in UI.
- **Mismatch:** Some subscription/access behavior appears frontend-local while backend podcast routes are public.
- **Technical Debt:** Legacy mock podcast data remains in a separate feature path.

### Severity

Medium

### Recommendation

Consolidate podcast implementation around the backend service, remove unused mock paths, and expose search/pagination if supported by backend query options.

### Files

- `src/features/society/podcasts/services/podcasts.service.ts`
- `src/features/society/podcasts/PodcastPage.tsx`
- `src/features/podcasts/services/podcasts.service.ts`

---

## Feature 1.10.3 المقالات

### Business Requirement

Customers should browse articles, open details, like, and comment where allowed.

### Current Frontend

Articles use a shared community post implementation. List/detail/comment/like flows are backend-backed.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/articles` | Article list |
| GET | `/api/v1/user/articles/{id}` | Article detail |
| POST | `/api/v1/user/articles/{id}/toggle-like` | Like/unlike |
| GET | `/api/v1/user/articles/{id}/comments` | Comments |
| POST | `/api/v1/user/articles/{id}/comments` | Add comment |

### Findings

- **Partially Implemented:** Core article API support is used.
- **Validation Missing:** Comment body validation should mirror backend min/max and display field errors.
- **UI Issue:** Backend errors such as comments disabled are not clearly mapped.
- **Missing:** Pagination metadata is not fully surfaced.

### Severity

Medium

### Recommendation

Map comment validation and backend permission errors directly into form states. Preserve pagination metadata in list/comment views.

### Files

- `src/features/society/community-posts/CommunityPostListPage.tsx`
- `src/features/society/community-posts/CommunityPostDetailPage.tsx`
- `src/features/society/community-posts/services/community-posts.service.ts`
- `backend/app/Http/Requests/Api/User/CommunityPost/StoreCommunityPostCommentRequest.php`

---

## Feature 1.10.4 النظريات

### Business Requirement

Customers should browse theories, open details, like, and comment where allowed.

### Current Frontend

Theories use the shared community post implementation and backend routes.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/theories` | Theory list |
| GET | `/api/v1/user/theories/{id}` | Theory detail |
| POST | `/api/v1/user/theories/{id}/toggle-like` | Like/unlike |
| GET | `/api/v1/user/theories/{id}/comments` | Comments |
| POST | `/api/v1/user/theories/{id}/comments` | Add comment |

### Findings

- **Partially Implemented:** Core backend routes are wired.
- **Validation Missing:** Comment validation and error display need backend parity.
- **UI Issue:** Pagination and permission/error states need improvement.

### Severity

Medium

### Recommendation

Apply the same community-post fixes as articles: validation, pagination metadata, and explicit backend error mapping.

### Files

- `src/features/society/community-posts/`
- `src/features/society/community-posts/services/community-posts.service.ts`

---

## Feature 1.10.5 الأبحاث

### Business Requirement

Subscribed customers should browse research, open full details, like, and comment where allowed.

### Current Frontend

Research uses the shared community post implementation, but the frontend calls protected research endpoints without first ensuring auth/subscription and can show empty/not-found states for authorization failures.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/research` | Research list, subscription required |
| GET | `/api/v1/user/research/{id}` | Research detail, subscription required |
| POST | `/api/v1/user/research/{id}/toggle-like` | Like/unlike |
| GET | `/api/v1/user/research/{id}/comments` | Comments |
| POST | `/api/v1/user/research/{id}/comments` | Add comment |

### Findings

- **Permission Issue:** Protected research APIs are mounted before a clean subscription gate.
- **Incorrect:** `401/403/subscription_required` can become "no research" or "content not found."
- **Business Logic Issue:** Frontend subscription access may use local user state instead of backend active subscription.

### Severity

High

### Recommendation

Gate research routes before data fetching. Use backend `/subscriptions/me` and map subscription-required responses to a subscription CTA.

### Files

- `src/features/society/community-posts/CommunityPostListPage.tsx`
- `src/features/society/community-posts/CommunityPostDetailPage.tsx`
- `src/features/society/community-posts/services/community-posts.service.ts`

---

## Feature 1.10.6 إرسال طلب تعاون أو اقتراح

### Business Requirement

Authenticated customers should submit collaboration/cooperation requests with a type, title, and message.

### Current Frontend

Cooperation page and form exist. Type loading occurs before auth is cleanly resolved, although backend requires auth. Form validation is mostly native/inline rather than shared field-error patterns.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/collaboration/types` | Active collaboration request types |
| POST | `/api/v1/user/collaboration/requests` | Submit request |

### Findings

- **Permission Issue:** Frontend fetches protected collaboration types for visitors.
- **Validation Missing:** Backend requires active type, title min/max, and message min/max; UI does not fully mirror this.
- **UI Issue:** Auth-required and validation errors are not mapped clearly.

### Severity

High

### Recommendation

Require auth before fetching types. Use `react-hook-form`/`zod` or equivalent shared form validation and display backend errors under exact fields.

### Files

- `src/features/society/cooperation/CooperationPage.tsx`
- `src/features/society/cooperation/CooperationRequestForm.tsx`
- `backend/app/Http/Requests/Api/User/Collaboration/StoreCollaborationRequest.php`

---

## Feature 1.10.7 تصفح موسوعة النباتات والفطريات

### Business Requirement

Subscribed customers should browse plant and fungi encyclopedia entries with categories/filters.

### Current Frontend

Plant/fungi list exists and uses backend APIs, but it can fetch before auth/subscription gating and relies on local subscription state.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/plants-fungi/categories` | Categories |
| GET | `/api/v1/user/plants-fungi` | Paginated/filterable plant/fungi list |

### Findings

- **Partially Implemented:** Backend APIs are used.
- **Permission Issue:** Protected queries can run before auth/subscription gate.
- **Business Logic Issue:** Subscription checks are frontend-local rather than backend `/subscriptions/me`.
- **Missing:** Pagination controls are not fully visible.

### Severity

High

### Recommendation

Gate protected queries, use backend active subscription state, expose pagination, and include plant/fungi clearly from community navigation.

### Files

- `src/features/society/plants-fungi/PlantFungiPage.tsx`
- `src/features/society/plants-fungi/services/plants-fungi.service.ts`

---

## Feature 1.10.8 تفاصيل نبات أو فطر

### Business Requirement

Subscribed customers should view details for a single plant/fungi entry.

### Current Frontend

Detail page exists and uses backend detail endpoint, but gate/error handling has the same protected-query issue as the list.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/plants-fungi/{id}` | Plant/fungi detail, subscription required |

### Findings

- **Partially Implemented:** Backend detail API is used.
- **Permission Issue:** Detail query can run before subscription gate.
- **Incorrect:** Authorization/subscription errors can be rendered as missing content.

### Severity

High

### Recommendation

Do not fetch detail until auth/subscription is confirmed. Map `401/403` states to login/subscription CTAs.

### Files

- `src/features/society/plants-fungi/PlantFungiDetailPage.tsx`
- `src/features/society/plants-fungi/services/plants-fungi.service.ts`

---

## Feature 1.11 التقييم الصحي

### Business Requirement

Customers should complete health assessments, receive/save results, and later view assessment history from their account.

### Current Frontend

Health assessment UI and local storage services exist. Records are stored locally and are not backed by a backend API.

### Backend Support

No health assessment customer API routes were found.

### Findings

- **Backend Feature Missing:** No backend health assessment records/results API.
- **Incorrect:** Sensitive health-related data is stored in local storage.
- **Business Logic Issue:** Results/history cannot be audited, synced, or used by backend care workflows.
- **Validation Missing:** Backend validation/business rules do not exist for submitted assessment data.

### Severity

Critical

### Recommendation

Implement backend health assessment schema, validation, result generation/storage, privacy controls, and account history endpoints. Avoid storing sensitive health records in local storage for production.

### Files

- `src/features/health-assessment/components/health-assessment-page.tsx`
- `src/features/health-assessment/services/health-assessment-storage.service.ts`
- `src/features/account/components/health-assessments-page.tsx`

---

## Feature 1.12 الاشتراكات

### Business Requirement

Customers should browse subscription plans, purchase a plan, and have subscription access enforced for subscriber-only features.

### Current Frontend

Subscriptions plan list, checkout, and current subscription hooks use backend APIs. Currency options and subscription source-of-truth are inconsistent in parts of the app.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/subscriptions/plans` | Plan list |
| GET | `/api/v1/user/subscriptions/plans/{id}` | Plan detail |
| POST | `/api/v1/user/subscriptions/checkout` | Create subscription checkout |
| GET | `/api/v1/user/subscriptions/me` | Current subscription and history |
| GET | `/api/v1/user/payment-methods` | Payment methods |

### Findings

- **Partially Implemented:** Backend subscription APIs are used.
- **Incorrect:** Subscription checkout exposes `GBP` and omits `SAR`, while backend supported currencies default to `KWD,SAR,AED,USD,EUR`.
- **Business Logic Issue:** Some feature gates still use local `isSubscriptionActive(user)` instead of backend `/subscriptions/me`.
- **Missing:** Payment callback/status UX is not complete.

### Severity

High

### Recommendation

Drive currency choices and subscription gates from backend. Use `/subscriptions/me` throughout protected community/learning access and add post-payment status handling.

### Files

- `src/features/subscriptions/ui/SubscriptionsPage.tsx`
- `src/features/subscriptions/ui/SubscriptionCheckoutPage.tsx`
- `src/features/subscriptions/services/subscriptions-api.service.ts`
- `src/features/subscriptions/services/subscription-access.service.ts`
- `backend/config/currency.php`

---

## Feature 1.13 النشرة الإلكترونية

### Business Requirement

Customers should subscribe to, verify, manage, and unsubscribe from the newsletter.

### Current Frontend

Account-level newsletter hooks exist for backend APIs. Footer/home newsletter flows still use local behavior and pending login intent.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/newsletter` | Newsletter subscription state |
| POST | `/api/v1/user/newsletter/subscribe` | Subscribe |
| POST | `/api/v1/user/newsletter/verify-code` | Verify subscription |
| POST | `/api/v1/user/newsletter/resend-verification` | Resend verification |
| DELETE | `/api/v1/user/newsletter` | Unsubscribe |

### Findings

- **Partially Implemented:** Backend hooks exist in account area.
- **Mismatch:** Public/footer newsletter behavior is local and not connected to backend state.
- **Backend Feature Not Used:** Verification/resend flows are not consistently surfaced where subscription starts.
- **UI Issue:** Newsletter copy is corrupted in places.

### Severity

Medium

### Recommendation

Unify newsletter flows around backend APIs and verification states. Remove local newsletter storage from production footer/home flows.

### Files

- `src/features/navigation/components/site-layout.tsx`
- `src/features/account/hooks/use-account-api.ts`
- `src/features/account/components/newsletter-page.tsx`

---

## Feature 1.14 مساعد B3 الذكي

### Business Requirement

B3 Assistant should help users through configured answers, safe behavior, and relevant guidance.

### Current Frontend

The assistant is keyword-based and local. The Next API route indicates the assistant is frontend keyword-based rather than a backend/AI service. Configuration and answers are stored locally.

### Backend Support

No backend B3 assistant configuration, keyword-answer, or conversation endpoint was found.

### Findings

- **Backend Feature Missing:** No assistant backend exists.
- **Partially Implemented:** A local keyword assistant exists.
- **Mismatch:** Assistant configuration is local, so admin/dashboard configuration cannot govern production behavior.
- **Business Logic Issue:** Conversations, analytics, escalation, and answer versioning are not backend-persisted.

### Severity

High

### Recommendation

Add backend assistant configuration/answer APIs or explicitly define the assistant as a frontend-only static widget. For production, persist configuration server-side and expose safe, auditable answer updates.

### Files

- `src/features/ai-assistant/services/assistant-config.service.ts`
- `src/features/ai-assistant/services/ai-chat.client.ts`
- `src/app/api/ai/chat/route.ts`

---

## Feature 1.15 الصفحة الرئيسية للحساب الشخصي

### Business Requirement

Authenticated customers should have a personal account dashboard summarizing profile, courses, books, bookings, consultations, trips, subscriptions, payments, health assessments, favorites, notifications, newsletter, logout, and deletion.

### Current Frontend

Account shell and multiple account pages exist. The implementation mixes backend account APIs with local storage records from care, payments, health, favorites, and demo auth.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/profile` | Profile |
| GET | `/api/v1/user/my-courses` | Customer courses |
| GET | `/api/v1/user/my-books` | Customer books |
| GET | `/api/v1/user/subscriptions/me` | Subscription |
| GET | `/api/v1/user/notifications` | Notifications |
| GET | `/api/v1/user/newsletter` | Newsletter state |

### Findings

- **Partially Implemented:** Account shell and several backend hooks exist.
- **Business Logic Issue:** Account summary is split between backend and local storage.
- **Missing:** Backend-backed clinic, consultation, trip, health, favorite, and unified payment sections are not available.
- **UI Issue:** Arabic strings are corrupted.

### Severity

High

### Recommendation

Define backend-owned account modules and remove production dependence on local records. Account home should summarize only backend-confirmed customer data.

### Files

- `src/features/account/components/account-shell.tsx`
- `src/features/account/hooks/use-account-api.ts`
- `src/features/account/components/`

---

## Feature 1.15.1 تعديل البيانات الشخصية

### Business Requirement

Customers should edit personal profile data and update email when applicable.

### Current Frontend

Profile hooks exist for backend profile fetch/update and email change OTP. Local auth profile state still exists and can diverge.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/profile` | Fetch profile |
| PUT | `/api/v1/user/profile` | Update profile |
| POST | `/api/v1/user/profile/email/send-code` | Send email change code |
| POST | `/api/v1/user/profile/email/verify-code` | Verify email change |
| POST | `/api/v1/user/profile/email/resend-code` | Resend code |

### Findings

- **Partially Implemented:** Backend profile APIs are represented.
- **Business Logic Issue:** Local user state can diverge from backend profile after updates/fallback auth.
- **Validation Missing:** Forms should consistently map backend validation errors to exact fields.

### Severity

Medium

### Recommendation

Make backend profile response update the only profile source after mutation and normalize validation display.

### Files

- `src/features/account/components/profile-page.tsx`
- `src/features/account/hooks/use-account-api.ts`
- `src/features/auth/auth-provider.tsx`

---

## Feature 1.15.2 تغيير كلمة المرور

### Business Requirement

Authenticated customers should change their password securely.

### Current Frontend

Backend password update hook exists, while `AuthProvider` still contains local password-changing behavior.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| PUT | `/api/v1/user/profile/password` | Change password |

### Findings

- **Partially Implemented:** Backend password endpoint is available through hooks.
- **Mismatch:** Local password storage behavior remains in provider logic.
- **Validation Missing:** Password form should mirror backend current/new/confirmation validation and field errors.

### Severity

High

### Recommendation

Remove local password mutation from production and use only backend password change flow with field-level validation.

### Files

- `src/features/account/components/password-page.tsx`
- `src/features/account/hooks/use-account-api.ts`
- `src/features/auth/auth-provider.tsx`

---

## Feature 1.15.3 دوراتي وشهاداتي

### Business Requirement

Customers should view enrolled courses, progress, certificates, and course invoices.

### Current Frontend

My-courses APIs are wired. Pagination, certificate eligibility, quiz/lesson access, and invoice/certificate status handling need tightening.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/my-courses` | Enrolled courses |
| GET | `/api/v1/user/my-courses/{id}` | Course detail |
| GET | `/api/v1/user/my-courses/{course}/certificate` | Certificate download |
| GET | `/api/v1/user/my-courses/{course}/invoice` | Invoice download |

### Findings

- **Partially Implemented:** Backend my-courses endpoints are used.
- **Backend Feature Not Used:** Pagination metadata is not fully surfaced.
- **Business Logic Issue:** Certificate/invoice actions need backend status-aware UI.
- **Incorrect:** Course player quiz/access issues affect this account section.

### Severity

High

### Recommendation

Preserve pagination, reflect certificate/invoice eligibility from backend, and fix course player access issues.

### Files

- `src/features/account/components/courses-page.tsx`
- `src/features/learning/components/course-player.tsx`
- `src/features/courses/services/courses-api.service.ts`

---

## Feature 1.15.4 كتبي

### Business Requirement

Customers should view purchased books, open ebooks, and download invoices.

### Current Frontend

My-books endpoints are wired, but reader access and invoice URL handling are not fully reliable.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/my-books` | Purchased books |
| GET | `/api/v1/user/my-books/{id}` | Purchased book detail |
| GET | `/api/v1/user/my-books/{order}/invoice` | Invoice download |
| GET | `/api/v1/user/books/{id}/stream-ebook` | Ebook stream |

### Findings

- **Partially Implemented:** Backend my-books APIs are used.
- **Incorrect:** Reader starts with local book ownership/content assumptions.
- **Business Logic Issue:** Invoice URL path construction may bypass API version normalization.
- **Permission Issue:** Ebook stream may fail auth if loaded as a raw iframe URL.

### Severity

High

### Recommendation

Use backend owned-book detail as the reader entry point and authenticated download/stream handling for ebooks and invoices.

### Files

- `src/features/account/components/books-page.tsx`
- `src/features/books/components/book-reader.tsx`
- `src/features/books/services/books-api.service.ts`

---

## Feature 1.15.5 حجوزات العيادات

### Business Requirement

Customers should view and manage clinic bookings from their account.

### Current Frontend

Clinic booking account data is local only.

### Backend Support

No backend clinic booking account endpoint was found.

### Findings

- **Backend Feature Missing:** No account booking API.
- **Incorrect:** Account can show local bookings not recognized by backend.
- **Business Logic Issue:** Cancellation/rescheduling/status cannot be enforced.

### Severity

Critical

### Recommendation

Add backend clinic booking list/detail/cancel/reschedule endpoints and replace local account records.

### Files

- `src/features/account/components/clinic-bookings-page.tsx`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.15.6 استشاراتي وباقات الاستشارات

### Business Requirement

Customers should view consultation sessions, packages, remaining balance, execution links, and statuses.

### Current Frontend

Consultation account state is local only.

### Backend Support

No backend consultation account endpoints were found.

### Findings

- **Backend Feature Missing:** No consultations/packages account API.
- **Incorrect:** Remaining package/session state is local.
- **Business Logic Issue:** Execution links, statuses, invoices, and package expiry are not authoritative.

### Severity

Critical

### Recommendation

Add backend consultation/package account endpoints and bind account pages to backend state.

### Files

- `src/features/account/components/consultations-page.tsx`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.15.7 باقات الرحلات المشتراة

### Business Requirement

Customers should view purchased trip packages, status, prerequisites, and trip details.

### Current Frontend

Trip purchases are local account records.

### Backend Support

No backend purchased trips endpoint was found.

### Findings

- **Backend Feature Missing:** No purchased trips account API.
- **Incorrect:** Trip account data is local-only.
- **Business Logic Issue:** Capacity, prerequisites, payment, and cancellation statuses are not backend-backed.

### Severity

Critical

### Recommendation

Add backend purchased-trip list/detail/status APIs and remove local trip records from production account pages.

### Files

- `src/features/account/components/trips-page.tsx`
- `src/features/care/services/care-data.service.ts`

---

## Feature 1.15.8 اشتراكي

### Business Requirement

Customers should view current subscription, history, status, and renewal/expiry details.

### Current Frontend

Subscription account hooks use backend `/subscriptions/me`, but other gates still use local subscription state.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/subscriptions/me` | Current subscription and history |

### Findings

- **Partially Implemented:** Backend subscription state is available.
- **Business Logic Issue:** App-wide subscriber gates are not consistently based on this endpoint.
- **UI Issue:** Renewal/payment status handling after checkout needs clearer backend-driven states.

### Severity

High

### Recommendation

Use `/subscriptions/me` as the single subscription source across account and protected content gates.

### Files

- `src/features/account/components/subscription-page.tsx`
- `src/features/subscriptions/services/subscriptions-api.service.ts`
- `src/features/subscriptions/services/subscription-access.service.ts`

---

## Feature 1.15.9 المدفوعات والفواتير

### Business Requirement

Customers should view payments and invoices across courses, books, subscriptions, clinics, consultations, and trips.

### Current Frontend

The frontend has local payment records for generic checkout and separate invoice downloads for some backend-backed products. There is no unified backend payment history endpoint.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/my-courses/{course}/invoice` | Course invoice |
| GET | `/api/v1/user/my-books/{order}/invoice` | Book invoice |
| GET/POST | `/api/v1/general/payments/callback` | Payment callback |

No unified customer payment history endpoint was found.

### Findings

- **Backend Feature Missing:** No unified payments/factures account API.
- **Partially Implemented:** Product-specific invoice endpoints exist for courses/books.
- **Incorrect:** Local checkout payments can appear in account without backend order/payment confirmation.
- **Missing:** Subscription, care, consultation, and trip invoices are not consistently backend-backed.

### Severity

High

### Recommendation

Add a unified payments/invoices API and update all account payment sections to use backend-confirmed transactions only.

### Files

- `src/features/account/components/payments-page.tsx`
- `src/features/checkout/components/checkout-page.tsx`
- `src/features/courses/services/courses-api.service.ts`
- `src/features/books/services/books-api.service.ts`

---

## Feature 1.15.10 التقييمات الصحية

### Business Requirement

Customers should view previous health assessment submissions/results.

### Current Frontend

Assessment history is local storage based.

### Backend Support

No backend health assessment history endpoint was found.

### Findings

- **Backend Feature Missing:** No backend history.
- **Incorrect:** Sensitive assessment data is local-only.
- **Business Logic Issue:** Records cannot be linked to care/consultation workflows.

### Severity

Critical

### Recommendation

Add backend health assessment history and privacy controls, then migrate account history to backend data.

### Files

- `src/features/account/components/health-assessments-page.tsx`
- `src/features/health-assessment/services/health-assessment-storage.service.ts`

---

## Feature 1.15.11 المفضلة

### Business Requirement

Customers should view and manage favorite/saved content.

### Current Frontend

Favorites are local only.

### Backend Support

No customer favorites endpoint was found.

### Findings

- **Backend Feature Missing:** No backend favorite/saved-content model.
- **Incorrect:** Favorites do not sync across devices or sessions.
- **Business Logic Issue:** Favorite status can become stale relative to active/deleted backend content.

### Severity

Medium

### Recommendation

Either remove favorites from production scope or add backend favorite endpoints for supported content types.

### Files

- `src/features/account/components/favorites-page.tsx`
- `src/features/favorites/`
- `src/features/courses/ui/CourseDetailView.tsx`
- `src/features/books/`

---

## Feature 1.15.12 الإشعارات

### Business Requirement

Customers should view, read, delete, and manage notifications.

### Current Frontend

Notification account hooks exist for backend APIs, but account shell unread count and some notification generation still use local notification state.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/notifications` | Notification list |
| GET | `/api/v1/user/notifications/unread-count` | Unread count |
| POST | `/api/v1/user/notifications/{id}/read` | Mark one as read |
| POST | `/api/v1/user/notifications/read-all` | Mark all read |
| DELETE | `/api/v1/user/notifications/{id}` | Delete one |
| DELETE | `/api/v1/user/notifications/clear-all` | Clear all |
| POST | `/api/v1/user/notifications/toggle` | Toggle notifications |
| POST | `/api/v1/user/notifications/delete-many` | Bulk delete |

### Findings

- **Partially Implemented:** Backend notification APIs are available in hooks.
- **Mismatch:** Shell unread count uses local notifications in places.
- **Business Logic Issue:** Local notification creation from demo purchases can diverge from backend notification history.

### Severity

Medium

### Recommendation

Use backend notification count/list everywhere in authenticated account UI and remove local notification generation from production purchase flows.

### Files

- `src/features/account/components/account-shell.tsx`
- `src/features/account/components/notifications-page.tsx`
- `src/features/account/hooks/use-account-api.ts`
- `src/features/auth/auth-provider.tsx`

---

## Feature 1.15.13 إدارة النشرة الإلكترونية

### Business Requirement

Customers should manage newsletter subscription and verification from account.

### Current Frontend

Account newsletter hooks exist and are backend-aware. Public footer/home newsletter behavior remains local, so account state can diverge from public subscription actions.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/user/newsletter` | Current newsletter state |
| POST | `/api/v1/user/newsletter/subscribe` | Subscribe |
| POST | `/api/v1/user/newsletter/verify-code` | Verify |
| POST | `/api/v1/user/newsletter/resend-verification` | Resend |
| DELETE | `/api/v1/user/newsletter` | Unsubscribe |

### Findings

- **Partially Implemented:** Account-level backend integration exists.
- **Mismatch:** Public newsletter entry points can use local storage instead of backend.
- **UI Issue:** Verification and resend states should be clearer and field-level.

### Severity

Medium

### Recommendation

Unify all newsletter entry points with account backend state and expose verification/resend consistently.

### Files

- `src/features/account/components/newsletter-page.tsx`
- `src/features/account/hooks/use-account-api.ts`
- `src/features/navigation/components/site-layout.tsx`

---

## Feature 1.15.14 تسجيل الخروج وحذف الحساب

### Business Requirement

Customers should be able to log out and delete their account through secure backend flows.

### Current Frontend

Logout calls backend and clears local state. Delete account requires local password validation before backend deletion and does not fully use backend impact data.

### Backend Support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/user/logout` | Logout |
| GET | `/api/v1/user/delete-account/impact` | Account deletion impact |
| POST | `/api/v1/user/delete-account` | Delete account |

### Findings

- **Partially Implemented:** Logout backend endpoint is used.
- **Incorrect:** Delete flow depends on local password/account checks before backend deletion.
- **Backend Feature Not Used:** Delete-account impact endpoint is not fully surfaced.
- **Business Logic Issue:** Local cleanup/anonymization is not a substitute for backend account deletion state.

### Severity

High

### Recommendation

Use backend delete impact as confirmation content and backend delete endpoint as the only production deletion authority. Remove local password gate except as UI input sent to backend if required.

### Files

- `src/features/auth/auth-provider.tsx`
- `src/features/account/components/delete-account-page.tsx`
- `src/features/auth/services/auth-api.service.ts`

---

## Global Summary

### Audit Statistics

| Metric | Count |
| --- | ---: |
| Total BRD customer-facing features reviewed | 60 |
| Dashboard/admin BRD sections excluded | 1 major section |
| Backend customer API endpoints reviewed | 85 |
| Fully implemented features | 3 |
| Partially implemented features | 40 |
| Missing or local-only production features | 17 |
| Features with backend support not fully used | 24 |
| Features with permission/gating issues | 18 |
| Features with validation gaps | 21 |
| Features with visible UI/i18n issues | 31 |
| Features with business-logic/source-of-truth mismatches | 42 |

### Critical Priority Work

- Remove production local/demo auth fallback and wire OTP/password reset entirely to backend.
- Disable or backend-implement clinic bookings, consultations, consultation packages, consultation execution, trips, and initial consultation prerequisites.
- Backend-implement health assessments before storing sensitive health data in production.
- Prevent local checkout/payment/account records from pretending to be backend-confirmed orders.

### High Priority Work

- Use backend subscription state everywhere and gate research, plants/fungi, and group chat before protected API calls.
- Fix course player access, quiz ID resolution, final quiz access, and certificate eligibility.
- Fix book checkout currency/address validation and ebook reader authorization.
- Add a unified backend payments/invoices account API.
- Repair Arabic mojibake across navigation, home, auth, account, checkout, and community.
- Add backend support or remove production claims for favorites, global search, and B3 Assistant configuration.

### Medium Priority Work

- Preserve and render backend pagination metadata for courses, books, community posts, comments, encyclopedia, plants/fungi, and podcasts.
- Use backend contact/social/legal/newsletter APIs in footer and public entry points.
- Normalize backend validation errors into exact field-level UI errors.
- Surface backend error states distinctly: unauthenticated, subscription required, unavailable, validation failed, and not found.

### Low Priority Work

- Remove unused legacy mock services once backend-backed replacements are complete.
- Consolidate query keys by feature according to repo conventions.
- Improve empty/loading states and copy polish after encoding cleanup.

### Overall Conclusion

The frontend has broad customer-facing route and UI coverage, but production readiness is uneven. Courses, books, subscriptions, newsletter, notifications, profile, reviews, and parts of community have real backend foundations. The largest risks are local-only care/trip/health/payment flows, demo auth fallback, inconsistent subscription gating, currency/address validation mismatches, and corrupted Arabic strings. The next engineering phase should prioritize removing local production state from transactional and sensitive flows, then completing backend-backed account and protected-content behavior.
