# Backend Pull Integration Plan for Frontend AI

Important: the backend developer did not change anything in this frontend codebase. The backend was pulled locally as a separate backend update, and this file is only an implementation plan for updating the Next.js frontend to consume those backend changes. Do not modify backend code as part of this plan.

## Source Summary

Backend repo pulled from `f0148ee` to `9838fc4`.

Main backend additions:
- User course catalog APIs, checkout, my-courses, lessons, quizzes, invoices, and certificates.
- Course taxonomy APIs for categories and levels.
- Per-course payment modes: full course and per-section purchase.
- Course progress tracking and final quiz/certificate states.
- Subscription-gated group chat APIs with admin/user messages and send permissions.
- Firebase Cloud Messaging config and admin browser notification support.
- Backend admin Blade pages for courses, curriculum, quizzes, certificates, students, and group chat.
- Shared backend changes to chunk upload, currency conversion, payment transaction resources, auth validation, and notification payloads.

## Non-Negotiable Constraints

- Do not change backend files.
- Keep feature code under `src/features/`, not root `features/`.
- Keep routes under `src/app/` thin.
- Use existing `apiFetch` from `src/lib/api/base-fetch.ts`.
- Use React Query for backend state and keep query keys in each feature query key file.
- Use `toastSuccess` / `toastError` patterns and existing mutation meta where possible.
- Use existing auth token storage through `b3_api_token`.
- Run `npm run lint` after implementing because this touches TypeScript, forms, data contracts, routes, and shared API contracts.

## Backend Contract Notes

All user API paths are normalized by `apiFetch`, so frontend can call `/api/user/...` and it becomes `/api/v1/user/...`.

Backend response envelope:
- `key`
- `msg`
- `data`
- `errors`

`apiFetch` already unwraps `data`, so service functions should type the unwrapped payload.

Pagination shape used by backend:
- `items`
- pagination metadata, depending on existing `PaginationTrait`

Existing frontend helpers already tolerate `items` or `data`; keep that behavior.

## Backend Contract Clarification Needed

Group chat room endpoint has a mismatch:
- `routes/Api/user.php` defines `GET /api/v1/user/group-chat/current-room`
- backend test calls `GET /api/v1/user/group-chat/room`

Implementation should prefer the route file (`current-room`) unless backend confirms `room` exists through another route registration. Add a small service fallback only if manual API testing proves both are needed.

## Phase 1 - Align Course API Types and Mappers

Files to update:
- `src/features/courses/types/api.types.ts`
- `src/features/courses/services/courses-api.service.ts`
- `src/features/courses/query-keys.ts`

Backend course list item shape:
- `id`
- `name`
- `short_description`
- `image`
- `hours`
- `category: { id, name }`
- `level: { id, name }`
- `price: { amount, currency, base_amount?, rate? }`
- `is_featured`
- `enrollment_status: "enrolled" | "not_enrolled" | null`

Backend course detail adds:
- `description`
- `intro_video`
- `instructor_name`
- `payment_mode: "full_only" | "full_and_per_section"`
- `payment_mode_label`
- `supports_section_payment`
- `curriculum_outline`
- `similar_courses`

Backend curriculum outline shape:
- `id`
- `name`
- `position`
- `is_locked`
- `lessons: [{ id, title, type, type_label, is_locked }]`

Frontend mapping tasks:
- Replace old course payment type values `full | installments` with backend values:
  - checkout `order_type`: `"full" | "section"`
  - course `payment_mode`: `"full_only" | "full_and_per_section"`
- Map backend `name` to frontend `title`.
- Map backend `short_description`/`description` to frontend descriptions.
- Map backend `price.amount` and `price.currency` into UI money fields.
- Map `enrollment_status === "enrolled"` into `isEnrolled`.
- Map `curriculum_outline` into `sections`.
- Map `similar_courses` into `relatedCourses`.
- Add course level fetching from `GET /api/user/courses/levels`.
- Update filters to match backend names:
  - `course_category_id`
  - `course_level_id`
  - `hours_min`
  - `hours_max`
  - `price_min`
  - `price_max`
  - `currency`
  - `search`
  - `order`

Acceptance criteria:
- Catalog pages read live backend data.
- Course detail page shows backend curriculum outline, intro video, price, instructor, category, level, and similar courses.
- Existing fallback/mock mapping is removed or isolated behind a deliberate dev fallback, not mixed into the live API hooks.

## Phase 2 - Replace Local Course Enrollment With Backend Checkout

Files to update:
- `src/features/courses/types/api.types.ts`
- `src/features/courses/services/courses-api.service.ts`
- `src/features/courses/hooks/use-course-api.ts`
- `src/features/courses/ui/CourseCheckoutPage.tsx`
- any shared checkout types under `src/features/checkout/`

Backend endpoints:
- `GET /api/user/courses/{id}/checkout-preview`
- `POST /api/user/courses/{id}/checkout`

Checkout preview query:
- `currency`

Checkout payload:
- `payment_method_id` required
- `currency` required
- `order_type` required: `"full"` or `"section"`
- `course_section_id` required only when `order_type === "section"`
- `idempotency_key` required, also sent as `X-Idempotency-Key`

Do not send old fields:
- `payment_mode`
- `installment_number`

Backend transaction response:
- `id`
- `payment_ref`
- `idempotency_key`
- `status`
- `status_label`
- `amount`
- `base_amount`
- `currency`
- `exchange_rate`
- `driver`
- `payment_method`
- `course_order`
- `message`
- `payment_url`
- `created_at`

Implementation tasks:
- Remove `addCourseEnrollment` local enrollment side effect from `useCheckoutCourse`.
- Use backend checkout mutation.
- On success:
  - If `payment_url` exists, redirect user or show continue-to-payment CTA.
  - If status is success/paid, invalidate course detail, course list, and my-courses queries.
  - Show backend `message` through toast success.
- Add checkout preview query for price/section selection if the UI needs pre-payment confirmation.
- Support per-section purchase when `supports_section_payment` is true.

Acceptance criteria:
- Checkout creates backend payment/course order.
- Repeated checkout uses idempotency key.
- My courses update after successful payment.
- Section checkout requires selecting a payable section.

## Phase 3 - Implement My Courses, Learning, Progress, Quizzes, Certificates

Files to update or add:
- `src/features/courses/types/api.types.ts`
- `src/features/courses/services/courses-api.service.ts`
- `src/features/courses/hooks/use-course-api.ts`
- `src/app/(learn)/learn/[courseId]/page.tsx`
- course learning UI components under `src/features/courses/` or a new `src/features/learning/` service layer if existing code already owns learning screens

Backend endpoints:
- `GET /api/user/my-courses`
- `GET /api/user/my-courses/{enrollment}`
- `GET /api/user/my-courses/{enrollment}/lessons/{lesson}`
- `POST /api/user/my-courses/{enrollment}/lessons/{lesson}/complete`
- `GET /api/user/my-courses/{enrollment}/quizzes/{quiz}`
- `POST /api/user/my-courses/{enrollment}/quizzes/{quiz}/submit`
- `GET /api/user/my-courses/{enrollment}/certificate`
- `GET /api/user/my-courses/{enrollment}/orders/{order}/invoice`

My course list item shape:
- `enrollment_id`
- `enrolled_at`
- `progress_percent`
- `is_completed`
- `final_exam_status`
- `payment_mode`
- `payment_mode_label`
- `course`
- `is_accessible`
- `sections_payment`
- `can_resume`
- `last_position`
- `certificate`
- `orders`

My course detail adds:
- `sections`
- `final_quiz`
- `actions.continue_learning`
- `actions.pay_next_section`
- `actions.download_certificate`

Lesson response:
- `id`
- `title`
- `type: "video" | "text" | "file" | "quiz"`
- `type_label`
- `content` for text lessons
- `video_url` for video lessons
- `file_url` for file lessons
- `course_quiz_id` for quiz lessons

Quiz start response:
- `id`
- `title`
- `type: "section" | "final"`
- `type_label`
- `passing_score`
- `questions: [{ id, question, choices: [{ id, choice }] }]`

Quiz submit payload:
- `answers` as an object map, not an array:
  - `{ "questionId": choiceId }`

Quiz result response:
- `quiz_id`
- `score`
- `passing_score`
- `passed`
- `correct_count`
- `wrong_count`
- `answers_review` only when passed

Implementation tasks:
- Create explicit my-course DTOs instead of reusing catalog `CourseListItem`.
- Route learning pages by `enrollment_id`, not only `courseId`, or add lookup from course id to enrollment id.
- Build lesson renderer for text/video/file/quiz.
- Add `completeLesson` mutation and invalidate my-course detail.
- Add quiz start and submit hooks with validation that every question has one selected choice.
- Add certificate download action using direct URL and auth token handling. If browser download cannot include Authorization header, fetch as blob via `apiFetch`-compatible helper.
- Add invoice download action for paid orders.
- Preserve progress and locked/accessibility states from backend instead of calculating locally.

Acceptance criteria:
- User can open enrolled course content from backend enrollment.
- Completing lesson updates progress.
- Section and final quizzes can be started and submitted.
- Certificate download is shown only when backend `certificate` or `actions.download_certificate` is present.
- Invoice links appear only for paid orders with `invoice_download_url`.

## Phase 4 - Implement Backend Group Chat API

Files to update or add:
- `src/features/community/components/community-chat.tsx`
- `src/features/community/services/group-chat-api.service.ts`
- `src/features/community/hooks/group-chat.keys.ts`
- `src/features/community/hooks/use-group-chat.ts`
- `src/features/community/types/group-chat.types.ts`

Backend endpoints:
- `GET /api/user/group-chat/current-room`
- `GET /api/user/group-chat/messages`
- `POST /api/user/group-chat/messages`

Access:
- Requires logged-in user.
- Requires active subscription due to `subscription.required` middleware.
- Expired/no subscription receives 403.
- User with `can_send = false` can read but cannot post.

Room response:
- `id`
- `is_current`
- `last_message`
- `can_send`

Message response:
- `id`
- `type`
- `body`
- `is_admin_message`
- `sender_name`
- `is_deleted`
- `created_at`

Send payload:
- `body`, required string, max 2000 chars

Implementation tasks:
- Replace local `community-chat-storage.service` usage with backend service calls.
- Use React Query for room and messages.
- Add send mutation that invalidates messages and room.
- Use backend `can_send` for disabled composer state.
- Treat 403 as subscription/access denied and reuse `AccessDeniedState`.
- Keep UI message alignment based on sender if backend exposes enough data. If backend does not expose sender id, align admin messages separately and treat non-admin messages as generic community messages.
- Preserve deleted-message rendering only if backend sends `is_deleted`; note backend currently hides soft-deleted client messages in tests.

Acceptance criteria:
- Guest sees login required.
- Non-subscriber sees subscription required/access denied.
- Active subscriber can list messages.
- Disabled sender can read but cannot post.
- Sending a message posts to backend and refreshes chat.

## Phase 5 - Firebase and Realtime Follow-Up

Backend added:
- `config/firebase.php`
- `firebase.json`
- `public/firebase-messaging-sw.js`
- FCM notification payload support for admin web notifications
- `RoomMessageCreated` event and broadcast channel updates

Frontend impact:
- The current Next app should not assume Firebase is ready unless frontend Firebase config is added.
- Decide whether chat should be polling-only first or realtime.

Implementation tasks:
- Start with polling/refetch interval for group chat, for example 10-15 seconds, to avoid blocking feature delivery.
- Add a separate follow-up for realtime:
  - confirm backend broadcast driver and public channel/auth requirements
  - confirm whether frontend should use Laravel Echo/Pusher or Firebase messaging
  - add `NEXT_PUBLIC_FIREBASE_*` env vars only if frontend will receive FCM
  - create or adapt service worker under Next public assets if needed
- Do not copy backend Firebase secrets into frontend. Only public Firebase web config may be exposed.

Acceptance criteria:
- Chat works without realtime.
- Realtime plan has confirmed backend channel names and frontend env values before implementation.

## Phase 6 - Payment, Currency, and Shared API Adjustments

Backend changed currency conversion and payment transaction resources.

Implementation tasks:
- Audit all course and book checkout code for payment transaction assumptions.
- Update shared `PaymentTransaction` types if they are reused by books/subscriptions.
- Confirm supported currencies from backend config or existing frontend currency context.
- Use backend `price.currency`, `price.amount`, and `price.rate` for display when returned.
- Do not calculate converted course prices in frontend when backend already returns converted values.

Acceptance criteria:
- Course catalog and checkout display backend converted amounts.
- Existing book/subscription checkout still compiles and behaves correctly.

## Phase 7 - Admin Surface Decision

Backend added admin Blade routes/pages for:
- course categories
- course levels
- courses
- course curriculum
- course quizzes
- course certificates
- course students
- admin group chat

Current frontend has Next admin routes such as:
- `src/app/(admin)/admin/courses`
- `src/app/(admin)/admin/users`

Decision needed before coding:
- Option A: keep course/admin management in Laravel Blade backend and do not duplicate in Next admin.
- Option B: build Next admin API clients and screens, but backend currently exposes these as web/admin routes, not JSON API endpoints.

Recommended:
- Do not implement Next admin course management until backend provides admin JSON endpoints or the product explicitly wants Next to replace backend Blade admin pages.
- In this frontend integration pass, focus on user-facing course and chat APIs.

## Phase 8 - Testing and Verification

Add or update tests where practical:
- course API mappers for catalog/detail/my-course/quiz response shapes
- checkout mutation payload test if services are already tested
- group chat service/hook test for 403 and `can_send = false`
- UI smoke tests for course detail, checkout, my-courses, lesson, quiz, and chat flows if test setup supports it

Manual verification checklist:
- `npm run typecheck`
- `npm run lint`
- `npm test`
- Log in as user with active subscription.
- Browse course catalog.
- Open course detail.
- Checkout full course with backend payment method id.
- Open my courses.
- Open lesson and complete it.
- Start and submit quiz.
- Check final quiz unlock after lessons complete.
- Download certificate when issued.
- Open group chat as active subscriber.
- Send message.
- Confirm disabled sender cannot post.
- Confirm no-subscription user sees access denied.

## Suggested Implementation Order for AI Agent

1. Update TypeScript contracts and backend mappers.
2. Convert course catalog/detail hooks from mock/local services to live API services.
3. Implement checkout preview and checkout payload changes.
4. Implement my-courses service, hooks, and learning screen wiring.
5. Implement lesson complete and quiz start/submit mutations.
6. Implement certificate and invoice download helpers.
7. Replace community chat local storage with backend group chat APIs.
8. Add polling or manual refresh for chat messages.
9. Run typecheck, lint, and tests.
10. Fix compile/test issues only in frontend code.

## Risks to Watch

- Group chat route mismatch: `current-room` vs `room`.
- Existing frontend course hooks currently use local mock data; replacing them may expose missing backend seed data in local dev.
- Existing checkout UI uses `paymentMode`/installment wording that does not match backend `order_type`/section purchase.
- Certificate and invoice downloads may need blob fetching because authenticated downloads through direct links may not include Bearer tokens.
- Backend `CourseDetailResource::additional(["similar_courses" => ...])` may not place similar courses where expected; verify actual JSON response before final mapper cleanup.
- Backend group chat message does not expose sender id, so exact "my message" alignment may need backend support or optimistic local metadata.
- Firebase web config should not be implemented from backend files blindly.

