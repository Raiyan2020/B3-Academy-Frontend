# Backend / Frontend Alignment Gaps

Audit date: 2026-07-08

Scope: compare the current frontend implementation against the backend changes pulled into `backend/`, especially course catalog, checkout, my-courses, lessons, quizzes, certificates, invoices, group chat, currency, and realtime support.

This file is a gap report only. It does not change backend code and does not propose backend edits unless the frontend cannot fully match the existing backend contract without a backend clarification.

## Summary

The frontend now covers the main backend surfaces, but it does not match the pulled backend perfectly yet. The highest-risk mismatches are around per-section checkout, quiz lesson IDs, final quiz access, authenticated downloads, invoice visibility, and group chat message ownership.

## Matching Areas

- Course list endpoint is wired to `GET /api/v1/user/courses`.
- Course categories are wired to `GET /api/v1/user/courses/categories`.
- Course levels are wired to `GET /api/v1/user/courses/levels`.
- Course detail is wired to `GET /api/v1/user/courses/{id}`.
- Course checkout posts to `POST /api/v1/user/courses/{id}/checkout`.
- My courses list is wired to `GET /api/v1/user/my-courses`.
- My course detail is wired to `GET /api/v1/user/my-courses/{enrollment}`.
- Lesson retrieval and completion use the backend lesson routes.
- Group chat room, messages, and send message use the backend group-chat routes.
- Group chat uses polling, which matches the plan's first realtime-safe step.

## Critical Gaps

### 1. Per-section checkout uses course detail sections, not checkout preview payable sections

Backend contract:
- `GET /api/v1/user/courses/{id}/checkout-preview` returns:
- `full_price`
- `sections` with section-specific `price`
- `supports_section_payment`
- backend validation only allows the first unpaid payable section, not any section.

Current frontend:
- `CourseCheckoutPage` uses `course.sections` from course detail/curriculum outline.
- It does not use `getCourseCheckoutPreview`.
- It lets users choose any section from the public curriculum outline.
- It does not display section prices from backend preview.

Impact:
- User may select a non-payable section and get backend validation errors.
- Section checkout UI does not match backend's actual payable state and pricing.

Required fix:
- Add a checkout preview query in `CourseCheckoutPage`.
- For `order_type: "section"`, populate section selector from preview `sections`, not course detail `curriculum_outline`.
- Show `full_price` for full checkout and selected section `price` for section checkout.
- Disable section checkout if preview `supports_section_payment` is false or preview `sections` is empty.

### 2. Quiz lessons likely send the lesson id instead of the quiz id

Backend contract:
- `MyCourseDetailResource` lesson items include:
- `id`
- `title`
- `type`
- `type_label`
- `is_completed`
- `is_accessible`
- It does not include `course_quiz_id`.
- Starting a quiz requires `GET /api/v1/user/my-courses/{enrollment}/quizzes/{quiz}` where `{quiz}` is the course quiz id.

Current frontend:
- In `CoursePlayer`, when a lesson has `type === "quiz"`, it calls:
- `String(lesson.courseQuizId || lesson.id)`
- Because `courseQuizId` is not present in the detail resource, this falls back to lesson id.

Impact:
- Quiz lessons can call the backend quiz endpoint with a lesson id instead of quiz id.
- This can return `course_quiz_not_found` even though the lesson exists.

Required fix:
- When clicking a quiz lesson, first fetch `GET /my-courses/{enrollment}/lessons/{lesson}` to receive `course_quiz_id`, then start that quiz id.
- Alternatively, request backend to include `course_quiz_id` in `MyCourseDetailResource` lesson items, but frontend should not assume it exists now.

### 3. Final quiz is not rendered or startable

Backend contract:
- `MyCourseDetailResource` includes a separate `final_quiz` object.
- Final quiz should be startable through the same `GET /my-courses/{enrollment}/quizzes/{quiz}` endpoint when `is_accessible` is true.

Current frontend:
- `CoursePlayer` only renders lessons inside `enrollment.sections`.
- It does not render `enrollment.finalQuiz`.
- The user has no UI path to start/submit the final quiz.

Impact:
- Course completion and certificate eligibility can be blocked because final exam cannot be taken from the frontend.

Required fix:
- Render a final quiz item after sections when `enrollment.finalQuiz` exists.
- Respect `finalQuiz.isAccessible`.
- Start quiz with `finalQuiz.id`.
- Show submitted/passed state from `isSubmitted` and `isPassed`.

### 4. Certificate download URL is wrong for authenticated backend downloads

Backend contract:
- `MyCourseResource::certificatePayload()` returns an absolute `download_url`:
- `/api/v1/user/my-courses/{enrollment}/certificate`
- The endpoint requires auth and returns a binary PDF or JSON error.

Current frontend:
- `getMyCourseCertificateUrl(enrollmentId)` returns `/api/user/my-courses/{enrollmentId}/certificate`.
- Anchor tags use that relative path directly.

Impact:
- Browser likely navigates to the Next.js app path instead of backend API base unless a proxy exists.
- Even if it hits backend, normal anchor navigation does not include the `Authorization: Bearer` token from `apiFetch`.
- Certificate download can fail for authenticated users.

Required fix:
- Prefer the backend-provided `certificate.download_url` when present.
- Add an authenticated blob download helper using the same API base and Bearer token as `apiFetch`.
- Use it for certificate downloads instead of a raw relative anchor.

### 5. Course invoice links are mapped but not rendered or downloaded safely

Backend contract:
- Paid course orders include `invoice_download_url`.
- Route: `GET /api/v1/user/my-courses/{enrollment}/orders/{order}/invoice`.
- This is an authenticated binary download.

Current frontend:
- `CourseOrderItem.invoiceDownloadUrl` is mapped.
- Account courses and learning page do not display order invoice links.
- No authenticated binary download helper exists for course invoices.

Impact:
- Users cannot access paid course invoices from the frontend, despite backend support.

Required fix:
- Render paid orders/invoice links in account course cards or a course detail drawer.
- Use an authenticated blob download helper, not a raw relative anchor.

## High Priority Gaps

### 6. Featured courses limit is not respected by backend and frontend does not slice

Backend behavior:
- `CourseCatalogService::featured(?User $user = null, int $limit = 12)` defaults to 12.
- `CourseController::featured()` does not read request `limit`.

Current frontend:
- Calls `getFeaturedCourses(3, currency)` with query `{ limit, currency }`.
- Maps all returned items and does not slice to `limit`.

Impact:
- Featured section can show up to 12 courses even when frontend asks for 3.

Required fix:
- Slice frontend response to `limit`, or update backend later to accept `limit`.
- Frontend-side slice is the only current no-backend-change fix.

### 7. Course list pagination is ignored

Backend contract:
- `GET /courses` and `GET /my-courses` return paginated data via `PaginationTrait`.

Current frontend:
- `getCourses()` and `getMyCourses()` only extract `items`.
- No pagination metadata is preserved.
- No pagination UI is present.

Impact:
- Only the first page is visible if backend returns multiple pages.

Required fix:
- Preserve pagination metadata in service return types.
- Add page/per_page query handling and pagination controls where lists can exceed one page.

### 8. Unsupported currency option is exposed in course checkout

Backend default supported currencies:
- `KWD,SAR,AED,USD,EUR`

Current frontend course checkout options:
- `USD`, `EUR`, `GBP`, `AED`, `KWD`

Impact:
- Choosing `GBP` can fail validation because `GBP` is not supported by backend default config.
- `SAR` is supported by backend but missing in frontend checkout.

Required fix:
- Replace `GBP` with `SAR`, or centralize supported currencies from config/constants that match backend.

### 9. Lesson and section accessibility states are not enforced in UI

Backend contract:
- My course detail sections include `is_accessible`.
- Lesson items include `is_accessible`.
- Backend enforces locks through `CourseAccessService`.

Current frontend:
- CoursePlayer uses `lesson.isLocked`, but backend detail sends `is_accessible`, not `is_locked`.
- Buttons are not disabled for inaccessible lessons or sections.
- Locked lesson clicks can make backend calls and then fail.

Impact:
- User can click unavailable content and see avoidable API errors.

Required fix:
- Treat `isAccessible === false` as locked.
- Disable inaccessible section/lesson/quiz buttons.
- Show lock icon and keep click inert for inaccessible items.

### 10. Quiz submit lacks frontend completeness validation

Backend contract:
- `SubmitCourseQuizRequest` requires `answers` as an object map.
- Every question must be answered.
- Each answer must be a single valid choice id belonging to that question.

Current frontend:
- Sends whatever answers object currently exists.
- Does not disable submit until every question has one answer.
- Does not show field-level missing-question guidance.

Impact:
- Users can submit incomplete quizzes and receive backend validation errors.

Required fix:
- Disable submit until all `quizQuery.data.questions` have selected choices.
- Show clear per-question missing state before calling backend.

## Medium Priority Gaps

### 11. Group chat message ownership cannot be represented accurately

Backend contract:
- `RoomMessageResource` returns:
- `id`
- `type`
- `body`
- `is_admin_message`
- `sender_name`
- `is_deleted`
- `created_at`
- It does not return `sender_id`.

Current frontend:
- Aligns every non-admin message to the right, visually implying it was sent by the current user.

Impact:
- Messages from other users can look like the current user's messages.

Required fix:
- Frontend should align admin messages distinctly and all non-admin messages neutrally unless backend adds sender identity.
- For exact "mine" alignment, backend must expose a safe `is_own_message` boolean or `sender_id`.

### 12. Group chat endpoint has no fallback for backend test mismatch

Backend route file:
- `GET /api/v1/user/group-chat/current-room`

Backend test:
- Calls `/api/v1/user/group-chat/room`

Current frontend:
- Uses only `current-room`.

Impact:
- If deployed backend differs from route file or aliases test behavior, frontend can fail room loading.

Required fix:
- Keep `current-room` as primary.
- Optionally add a 404 fallback to `group-chat/room` if manual backend smoke testing confirms the alias exists or is needed.

### 13. Group chat errors are all shown as subscription-required

Backend behavior:
- Group chat routes can fail for auth/subscription/access errors, validation, server errors, or network errors.

Current frontend:
- Any `roomQuery.error` renders `subscription_required`.

Impact:
- Network/server/API bugs can be mislabeled as subscription problems.

Required fix:
- Inspect `ApiError.status`.
- Show subscription/access state for 403.
- Show generic retry/error state for non-403 failures.

### 14. Course checkout success does not explicitly route to my-courses on successful payment

Backend behavior:
- Simulated or synchronous payment can return `SUCCESS` and include a paid `course_order`.

Current frontend:
- If no `payment_url`, it only shows a message.
- It does not offer or trigger navigation to `/dashboard/courses` after success.

Impact:
- User may not know that the enrollment is ready.

Required fix:
- If `transaction.status === "success"` or course order is paid, show a prominent continue-learning / my-courses CTA.
- Invalidate my-courses and course detail after success, already partially done.

### 15. Checkout preview helper exists but is not integrated

Current frontend:
- `getCourseCheckoutPreview()` exists in the service.
- No hook or UI uses it.

Impact:
- Backend preview endpoint is effectively unimplemented from the user's perspective.

Required fix:
- Add a query hook and use it in checkout.

## Low Priority / Cleanup Gaps

### 16. Course player imports an unused checkout preview helper

Current frontend:
- `CoursePlayer` imports `getCourseCheckoutPreview` but does not use it.

Impact:
- Noise and future confusion.

Required fix:
- Remove unused import.

### 17. Query keys for new group chat are inline arrays

Repo convention:
- Each feature owns query keys and avoids inline string arrays.

Current frontend:
- `CommunityChat` uses inline arrays like `['group-chat-room', user?.id]`.

Impact:
- Small consistency issue with project conventions.

Required fix:
- Add `src/features/community/hooks/group-chat.keys.ts`.
- Reuse keys in component/hook code.

### 18. Group chat service types live inside the service file

Plan expectation:
- `src/features/community/types/group-chat.types.ts`

Current frontend:
- `GroupChatRoom` and `GroupChatMessage` are exported from `group-chat-api.service.ts`.

Impact:
- Minor structure mismatch with the plan and repo feature layout.

Required fix:
- Move exported types to `src/features/community/types/group-chat.types.ts`.

### 19. `tsconfig.tsbuildinfo` was modified by verification

Current git status:
- `tsconfig.tsbuildinfo` is modified.

Impact:
- Build cache file should usually not be part of the implementation diff unless intentionally tracked.

Required fix:
- Decide whether to leave it, ignore it, or remove it from the final staged changes according to repo policy.

## Backend-Owned / Decision Items

### Admin course management

Backend added Laravel Blade admin pages for course management. The current frontend cannot perfectly "match" those admin features unless backend exposes JSON admin APIs or the product decides to rebuild admin course management in Next.js.

Recommendation:
- Treat this as backend-owned for now.
- Do not duplicate Laravel Blade admin screens in Next.js without an explicit product decision.

### Firebase / realtime

Backend has FCM config and broadcast channels:
- `room.{roomId}`
- `admin.group-chat.{roomId}`

Current frontend:
- Uses polling every 10 seconds.

Recommendation:
- Polling is acceptable as the first implemented state from the plan.
- Realtime requires a separate confirmed decision: Laravel Echo/Pusher vs Firebase Messaging, required public env vars, and frontend service worker setup.

## Verification Notes

Commands previously run during implementation:
- `npm run typecheck` passed.
- Targeted ESLint on changed frontend files passed.

Known limitation:
- Full `npm run lint` currently scans backend vendor/public JS assets and fails on unrelated backend files. This does not prove the frontend integration is broken, but it prevents a clean full-repo lint signal until lint ignore rules are fixed.

## Recommended Fix Order

1. Fix checkout preview and section payable selection.
2. Fix quiz lesson id handling and render final quiz.
3. Add authenticated binary download helpers for certificates and course invoices.
4. Render course invoices in my-courses/account UI.
5. Enforce `is_accessible` states in the learning UI.
6. Add frontend quiz completeness validation.
7. Slice featured courses to requested limit and add pagination handling.
8. Align currency options with backend supported currencies.
9. Normalize group chat query keys/types and improve error handling.
10. Decide separately on realtime/Firebase and admin duplication.

