# Unused Backend Endpoints Report

This document outlines all the endpoints registered in the Laravel backend (`backend/routes/Api/`) that are currently **not** consumed by the Next.js frontend (`src/`).

---

## 1. General Endpoints (`routes/Api/general.php`)
**Base Prefix:** `/api/v1/general` (or `/api/general`)

All endpoints in `general.php` are currently unused as the frontend implements static content or does not connect these pages to the backend.

| Method | Endpoint | Backend Controller & Method | Purpose / Notes |
|---|---|---|---|
| `POST` | `/contact-messages` | `ContactMessageController@store` | Store user support/contact message |
| `GET/POST` | `/payments/callback` | `PaymentCallbackController@handle` | Payment webhook callback from payment gateway |
| `GET` | `/about` | `GeneralController@about` | Fetch "About Us" content |
| `GET` | `/terms` | `GeneralController@terms` | Fetch terms of service |
| `GET` | `/privacy` | `GeneralController@privacy` | Fetch privacy policy |
| `POST` | `/change-lang` | `GeneralController@changeLang` | Update session/profile preferred language |
| `GET` | `/countries` | `GeneralController@countries` | Fetch list of supported countries |
| `GET` | `/faqs` | `GeneralController@faqs` | Fetch list of FAQs |
| `GET` | `/social-media` | `GeneralController@socialMedia` | Fetch platform social links |
| `GET` | `/contact` | `GeneralController@contact` | Fetch contact information details |

---

## 2. User & Authentication Endpoints (`routes/Api/user.php`)
**Base Prefix:** `/api/v1/user` (or `/api/user`)

### Authentication & Account Security
The frontend manages user authentication locally via `LocalStorage` (`auth-storage.service.ts`), leaving all backend authentication routes unused.

| Method | Endpoint | Backend Controller & Method | Purpose / Notes |
|---|---|---|---|
| `POST` | `/login` | `AuthController@login` | User login session initialization |
| `POST` | `/register` | `AuthController@register` | Student/user registration |
| `POST` | `/forgot-password` | `AuthController@forgotPassword` | Request password reset code (email link/OTP) |
| `POST` | `/forgot-password/send-code` | `AuthController@forgotPassword` | Send password reset verification code |
| `POST` | `/resend-code` | `AuthController@resendCode` | Resend registration OTP |
| `POST` | `/verify-code` | `AuthController@verifyCode` | Verify registration OTP code |
| `POST` | `/forgot-password/verify-code` | `AuthController@verifyCode` | Verify reset password code |
| `POST` | `/reset-password` | `AuthController@resetPassword` | Change password with verification code |
| `POST` | `/logout` | `AuthController@logout` | Terminate session and invalidate token |
| `GET` | `/delete-account/impact` | `AuthController@accountDeletionImpact` | Retrieve details on content loss before deletion |
| `POST` | `/delete-account` | `AuthController@deleteAccount` | Permanently flag user account as deleted |

### User Profile Management
Profile and password updates are handled locally in mock storage, meaning these endpoints are not invoked.

| Method | Endpoint | Backend Controller & Method | Purpose / Notes |
|---|---|---|---|
| `GET` | `/profile` | `ProfileController@show` | Fetch logged-in user profile details |
| `PUT` | `/profile` | `ProfileController@update` | Update profile information (name, avatar) |
| `POST` | `/profile/email/send-code` | `ProfileController@sendEmailChangeCode` | Initiate email address change verification |
| `POST` | `/profile/email/resend-code` | `ProfileController@resendEmailChangeCode` | Resend email change verification code |
| `POST` | `/profile/email/verify-code` | `ProfileController@verifyEmailChangeCode` | Finalize email address update |
| `PUT` | `/profile/password` | `ProfileController@changePassword` | Change user password |

### Newsletter Subscriptions
The newsletter state is mocked in `newsletter-storage.service.ts` and not synced to the Laravel database.

| Method | Endpoint | Backend Controller & Method | Purpose / Notes |
|---|---|---|---|
| `GET` | `/newsletter` | `NewsletterController@show` | Fetch newsletter subscription status |
| `POST` | `/newsletter/subscribe` | `NewsletterController@subscribe` | Request email subscription to newsletter |
| `POST` | `/newsletter/verify-code` | `NewsletterController@verifyCode` | Verify newsletter confirmation code |
| `POST` | `/newsletter/resend-verification` | `NewsletterController@resendVerification` | Resend verification code for subscription |
| `DELETE` | `/newsletter` | `NewsletterController@unsubscribe` | Cancel newsletter subscription |

### Shipping Addresses
Shipping addresses for book checkout are stored locally in the logged-in `user` object in mock storage.

| Method | Endpoint | Backend Controller & Method | Purpose / Notes |
|---|---|---|---|
| `GET` | `/addresses` | `UserAddressController@index` | Fetch all user shipping addresses |
| `POST` | `/addresses` | `UserAddressController@store` | Add a new shipping address |
| `PUT` | `/addresses/{id}` | `UserAddressController@update` | Update an existing shipping address |
| `PATCH` | `/addresses/{id}/set-default` | `UserAddressController@setDefault` | Set default shipping address |
| `DELETE` | `/addresses/{id}` | `UserAddressController@destroy` | Delete a shipping address |

### User Notifications
Notifications are triggered, stored, and managed client-side in `account-records.service.ts`.

| Method | Endpoint | Backend Controller & Method | Purpose / Notes |
|---|---|---|---|
| `GET` | `/notifications` | `NotificationController@index` | Fetch user notification center list |
| `POST` | `/notifications/{id}/read` | `NotificationController@markAsRead` | Mark a notification as read |
| `DELETE` | `/notifications/{id}` | `NotificationController@destroy` | Delete a single notification |
| `DELETE` | `/notifications/clear-all` | `NotificationController@clearAll` | Delete all notification logs |
| `POST` | `/notifications/toggle` | `NotificationController@toggleNotifications` | Toggle notification preferences |
| `GET` | `/notifications/unread-count` | `NotificationController@unreadCount` | Fetch badge count for unread notifications |
| `POST` | `/notifications/read-all` | `NotificationController@markAllAsRead` | Mark all notifications as read |
| `POST` | `/notifications/delete-many` | `NotificationController@deleteMany` | Batch delete notifications |
| `GET` | `/notifications/{id}` | `NotificationController@show` | View specific notification details |

### Encyclopedia (Herbal & News)
The encyclopedia section (`/encyclopedia`) is driven entirely by local mock data (`encyclopedia.service.ts` -> `MOCK_ENTRIES`).

| Method | Endpoint | Backend Controller & Method | Purpose / Notes |
|---|---|---|---|
| `GET` | `/encyclopedia` | `EncyclopediaController@index` | Fetch high-level encyclopedia listing |
| `GET` | `/encyclopedia/news-types` | `EncyclopediaController@newsTypes` | Fetch available news category tags |
| `GET` | `/encyclopedia/news` | `EncyclopediaController@newsList` | Fetch platform/botany news articles |
| `GET` | `/encyclopedia/news/{id}` | `EncyclopediaController@showNews` | Fetch specific news article detail |
| `GET` | `/encyclopedia/herbal/families` | `EncyclopediaController@herbalFamilies` | Fetch herbal families catalog |
| `GET` | `/encyclopedia/herbal/species` | `EncyclopediaController@herbalSpecies` | Fetch herbal species catalog |
| `GET` | `/encyclopedia/herbal/genera` | `EncyclopediaController@herbalGenera` | Fetch herbal genera catalog |
| `GET` | `/encyclopedia/herbal/origins` | `EncyclopediaController@herbalOrigins` | Fetch herbal origin countries |
| `GET` | `/encyclopedia/herbal` | `EncyclopediaController@herbalList` | Fetch list of herbs/monographs |
| `GET` | `/encyclopedia/herbal/{id}` | `EncyclopediaController@showHerbal` | Fetch details of a single herb |

### Other Specific Route Suffixes
| Method | Endpoint | Backend Controller & Method | Purpose / Notes |
|---|---|---|---|
| `GET` | `/home` | `HomepageController@index` | Fetch customized dynamic homepage configuration |
| `GET` | `/sliders` | `HomepageController@sliders` | Fetch platform sliders and banners |
| `GET` | `/academic-specializations` | `HomepageController@academicSpecializations` | Fetch list of academic specializations |
| `GET` | `/books/{id}/stream-ebook` | `BookController@streamEbook` | Stream ebook (PDF/EPUB reader) content |

---

## 3. Discrepancy: Frontend Paths with Missing Backend Implementation
The frontend contains calls to `/api/user/courses/*` inside [courses-api.service.ts](file:///c:/Users/abdallah/Desktop/ahmed/b3-acadmy/src/features/courses/services/courses-api.service.ts), but there is **no implementation** or routes defined for courses in the backend routes file:

*   `GET /api/user/courses/categories`
*   `GET /api/user/courses`
*   `GET /api/user/courses/featured`
*   `GET /api/user/courses/{id}`
*   `GET /api/user/my-courses`
*   `POST /api/user/courses/{id}/checkout`
