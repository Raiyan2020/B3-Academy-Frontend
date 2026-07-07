# Frontend Endpoint Usage Plan

## Constraint

Backend code is fixed. All work must happen in the frontend and must use the Laravel API exactly as it exists today. If an endpoint is unavailable, unauthenticated, or returns a different shape than expected, the frontend should keep the current business-facing UI working with local/static fallback content.

## Implementation Priority

1. Public business content endpoints: safe to use without an auth refactor and directly improve business alignment for the website pages.
2. Public homepage endpoints: use backend-managed sliders, FAQs, and academic specializations where available.
3. Authenticated account endpoints: wire after auth token persistence is upgraded, because these routes require `auth:user`.
4. Reader/account-special endpoints: wire after the required owning account flow is reliable.

## Implemented Now

| Backend endpoint | Frontend owner | Usage |
| --- | --- | --- |
| `GET /api/v1/general/about` | `src/features/site-content` | About page pulls admin-managed HTML/content, with current copy as fallback. |
| `GET /api/v1/general/terms` | `src/features/site-content` | Terms page pulls admin-managed HTML/content, with current copy as fallback. |
| `GET /api/v1/general/privacy` | `src/features/site-content` | Privacy page pulls admin-managed HTML/content, with current copy as fallback. |
| `GET /api/v1/general/faqs` | `src/features/site-content` | FAQ page and home FAQ can display backend-managed FAQ rows. |
| `GET /api/v1/general/contact` | `src/features/site-content` | Contact page reads backend-managed email, phone, and social links. |
| `GET /api/v1/general/social-media` | `src/features/site-content` | Contact page can fill social links from backend records. |
| `GET /api/v1/general/countries` | `src/features/site-content` | Hook/service available for forms needing country/phone metadata. |
| `POST /api/v1/general/contact-messages` | `src/features/site-content` | Contact form submits support/contact messages to backend. |
| `GET /api/v1/user/home` | `src/features/site-content` | Hook/service available for homepage-managed sliders, academic specializations, FAQs. |
| `GET /api/v1/user/sliders` | `src/features/site-content` | Hook/service available for standalone slider usage. |
| `GET /api/v1/user/academic-specializations` | `src/features/site-content` | Hook/service available for education/home specialty sections. |
| `POST /api/v1/user/login` | `src/features/auth` | Auth provider attempts backend login first, then falls back to local demo accounts if unavailable. |
| `POST /api/v1/user/register` | `src/features/auth` | Registration submits to backend and preserves local compatibility. |
| `POST /api/v1/user/verify-code` | `src/features/auth` | Service available for backend OTP verification. |
| `POST /api/v1/user/resend-code` | `src/features/auth` | Service available for backend OTP resend. |
| `POST /api/v1/user/forgot-password` | `src/features/auth` | Service available for backend password reset requests. |
| `POST /api/v1/user/forgot-password/verify-code` | `src/features/auth` | Service available for backend reset-code verification. |
| `POST /api/v1/user/reset-password` | `src/features/auth` | Service available for backend password reset. |
| `POST /api/v1/user/logout` | `src/features/auth` | Auth provider calls backend logout and clears stored API token. |
| `GET /api/v1/user/delete-account/impact` | `src/features/auth` | Service available for account deletion impact UI. |
| `POST /api/v1/user/delete-account` | `src/features/auth` | Auth provider calls backend deletion while preserving local cleanup. |
| `GET /api/v1/user/profile` | `src/features/account` | Profile hook available and profile page detects token-backed profile. |
| `PUT /api/v1/user/profile` | `src/features/account` | Profile page saves to backend when token-backed, local fallback otherwise. |
| `POST /api/v1/user/profile/email/send-code` | `src/features/account` | Profile email-change OTP sends to backend when token-backed. |
| `POST /api/v1/user/profile/email/resend-code` | `src/features/account` | Profile email-change OTP resend uses backend when token-backed. |
| `POST /api/v1/user/profile/email/verify-code` | `src/features/account` | Profile email change verifies against backend when token-backed. |
| `PUT /api/v1/user/profile/password` | `src/features/account` | Hook/service available for password page integration. |
| `GET /api/v1/user/newsletter` | `src/features/account` / `src/features/newsletter` | Newsletter page reads backend subscription status when token-backed. |
| `POST /api/v1/user/newsletter/subscribe` | `src/features/account` / `src/features/newsletter` | Newsletter page submits backend subscription requests. |
| `POST /api/v1/user/newsletter/verify-code` | `src/features/account` / `src/features/newsletter` | Newsletter page verifies backend OTP. |
| `POST /api/v1/user/newsletter/resend-verification` | `src/features/account` / `src/features/newsletter` | Newsletter page resends backend verification. |
| `DELETE /api/v1/user/newsletter` | `src/features/account` / `src/features/newsletter` | Newsletter page unsubscribes through backend. |
| `GET /api/v1/user/addresses` | `src/features/account` | Address hook/service available for checkout/settings integration. |
| `POST /api/v1/user/addresses` | `src/features/account` | Address create mutation available. |
| `PUT /api/v1/user/addresses/{id}` | `src/features/account` | Address update mutation available. |
| `PATCH /api/v1/user/addresses/{id}/set-default` | `src/features/account` | Default address mutation available. |
| `DELETE /api/v1/user/addresses/{id}` | `src/features/account` | Address delete mutation available. |
| `GET /api/v1/user/notifications` | `src/features/account` | Notifications page reads backend notifications when token-backed. |
| `GET /api/v1/user/notifications/unread-count` | `src/features/account` | Hook/service available for badge count integration. |
| `POST /api/v1/user/notifications/{id}/read` | `src/features/account` | Notifications page marks backend items read. |
| `POST /api/v1/user/notifications/read-all` | `src/features/account` | Notifications page marks all backend items read. |
| `DELETE /api/v1/user/notifications/{id}` | `src/features/account` | Service available for single delete. |
| `POST /api/v1/user/notifications/delete-many` | `src/features/account` | Notifications page deletes selected backend notifications. |
| `DELETE /api/v1/user/notifications/clear-all` | `src/features/account` | Service available for clear-all. |
| `POST /api/v1/user/notifications/toggle` | `src/features/account` | Service available for notification preference toggle. |
| `GET /api/v1/user/encyclopedia` | `src/features/library` | Encyclopedia API service available. |
| `GET /api/v1/user/encyclopedia/news` | `src/features/library` | Encyclopedia page prefers backend news. |
| `GET /api/v1/user/encyclopedia/news/{id}` | `src/features/library` | Numeric encyclopedia detail routes can load backend news detail. |
| `GET /api/v1/user/encyclopedia/herbal` | `src/features/library` | Encyclopedia page prefers backend herbal entries. |
| `GET /api/v1/user/encyclopedia/herbal/{id}` | `src/features/library` | Numeric encyclopedia detail routes can load backend herbal detail. |
| `GET /api/v1/user/books/{id}/stream-ebook` | `src/features/books` | Book reader opens backend stream for numeric backend book IDs when local page content is unavailable. |

## Next Frontend-Only Work

1. Address UI integration
   - Services and hooks are implemented.
   - Next step is replacing local address editing in settings/checkout with backend-backed address state when token-backed.

2. Password page integration
   - Backend password mutation exists.
   - Next step is replacing the dashboard password page's local mutation with `useChangeBackendPassword` when token-backed.

3. Notification badge integration
   - Notification center is backend-backed.
   - Next step is using backend unread count in dashboard/sidebar badges when token-backed.

4. Auth OTP/reset UI integration
   - Auth API services exist.
   - Current auth provider supports backend-first login/register and exposes reset/verify services for a follow-up UI cleanup.

## Endpoints Not To Use From Frontend

`GET/POST /api/v1/general/payments/callback` is a payment gateway callback endpoint. It should not be called directly by the browser UI except for displaying gateway return state if the backend/payment provider redirects the user.

## Known Backend Gap

There are no course endpoints in `backend/routes/Api/user.php`. The frontend must keep courses as frontend-managed/local content unless the backend adds course routes later.
