# Route inventory

This inventory is generated from and checked against `src/app/**/page.tsx` during Phase 0 validation. Dynamic segments use Next.js bracket notation. The production build is the authoritative route check.

- Public: `/`, `/about`, `/auth`, `/contact`, `/education`, `/faq`, `/privacy`, `/ratings`, `/rate-us`, `/search`, `/subscriptions`, `/terms`
- Courses: `/courses`, `/courses/[courseId]`, `/learn/[courseId]`
- Books/library: `/books`, `/books/[bookId]`, `/read/[bookId]`, `/encyclopedia`, `/encyclopedia/[entryId]`, `/monograph`, `/monograph/[monographId]`
- Care: `/clinic`, `/clinic/[clinicId]`, `/clinic/[clinicId]/book`, `/clinic-booking/[bookingId]`, `/consultations`, `/consultations/[doctorId]/book`, `/consultation/[consultationId]`, `/consultation/[consultationId]/chat`, `/trips`, `/trips/[tripId]`, `/trips/[tripId]/initial-consultation`
- Community: `/community`, `/community/blogs`, `/community/blogs/[blogId]`, `/community/chat`, `/community/cooperation`, `/community/podcast-request`, `/community/researches`, `/community/researches/[researchId]`, `/community/theories`, `/community/theories/[theoryId]`, `/podcasts`
- Commerce: `/checkout/[type]/[id]/[[...format]]`
- Account: `/dashboard` and all section routes under `/dashboard/*`; `/health-assessment`; `/settings` redirects to `/dashboard/profile`
- Admin: `/admin` (redirects to `/admin/users`), `/admin/users`, `/admin/users/new`, `/admin/users/[userId]`, `/admin/users/[userId]/edit`, `/admin/courses`, `/admin/courses/new`, `/admin/courses/[id]/edit`, `/admin/books`, `/admin/books/new`, `/admin/books/[id]/edit`, `/admin/encyclopedia`, `/admin/clinics`, `/admin/clinics/[id]/edit`, `/admin/consultations`, `/admin/consultations/[id]/edit`, `/admin/trips`, `/admin/trips/[id]/edit`, `/admin/schedule`, `/admin/community`, `/admin/podcasts`, `/admin/podcasts/new`, `/admin/podcasts/[id]/edit`, `/admin/newsletter`, `/admin/assistant`
- Doctor: `/doctor`, `/doctor/appointments/[id]`

The API route `/api/ai/chat` is compatibility-only and must not be used by the keyword-only customer assistant.
