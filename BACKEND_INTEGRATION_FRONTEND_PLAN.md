# Backend Integration — Frontend Implementation Plan

> **Goal:** wire the Next.js frontend to the backend API contracts that were added in the latest backend pull (through Jul 15, 2026). The backend (`/backend`, a separate git repo, gitignored) is the source of truth and **must not be changed**. Every task below adapts the frontend to consume what the backend already ships.

---

## ✅ Implementation status (updated after execution)

Verification gate after implementation: **`tsc --noEmit` = 0 errors · `vitest` = 49/49 pass · eslint on new code = 0 errors** (the ~1.8k repo lint errors are all pre-existing, in `backend/` + minified vendor files).

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Invoice URL fix + conventions | ✅ Done (`getMyBookInvoiceUrl` now relative) |
| 1 | Clinics: API layer + catalog + detail + **appointment booking** (self-contained, real POST + slots + payment method + `payment_url`/`fulfill-slot`) | ✅ Done |
| 2 | Trips: API layer (catalog/featured/detail/IC-types/slots/book/fulfill/purchase/portal/account-orders) + catalog/detail wired + account trip-packages list + invoice download + **purchase** (self-contained `TripCheckoutPage`) + **IC booking** (self-contained slot flow) | ✅ Done |
| 3 | Care portals: generic list/detail/messages/invoice service for all 4 resources + chat (real GET/POST, portal-gated) + consultation/clinic-booking detail + dashboards | ✅ Done |
| 4 | Global search: API service + debounced hook + results grouped/routed | ✅ Done |
| 5 | Account payments: paginated API + invoice download (public `pdf_download_url`) | ✅ Done |
| 6 | Encyclopedia taxonomy: news-types + herbal families/species/genera/origins endpoints + `filters[...]` bag + backend-driven dropdowns | ✅ Done (news-type dropdown UI not yet added — hook ready) |
| 7 | Health assessments: form/list/submit/detail API + form driven by real `condition_id`s + account history | ✅ Done |
| 8 | Certificate/invoice: 404-safe download with `toastError` | ✅ Done (legacy jsPDF `certificate.service.ts` retire deferred to Phase 9) |
| 9 | Cleanup of dead mock layers + tests | ✅ Done — deleted 9 orphaned files (see below) |

### Booking-creation flows — now wired self-contained (off the mock checkout)

All care booking/purchase creation now uses dedicated, self-contained flows (real POST → `payment_url` redirect → `fulfill-slot` when `requires_slot_selection`), leaving the shared course/book/subscription checkout untouched:

- **Clinic appointment** — `clinic-booking-flow.tsx` (real slots + payment method + `bookClinicAppointment`).
- **Clinic initial consultation** — `clinic-initial-consultation-flow.tsx` at route `/clinic/{id}/initial-consultation`.
- **Trip initial consultation** — `/trips/{id}/initial-consultation` page (real IC types → slots → `bookTripInitialConsultation`).
- **Trip package purchase** — `TripCheckoutPage` (`/checkout/trip-package/{id}` now branches to it, like course/book).

> **Note — individual consultations have no client booking endpoint.** `routes/Api/user.php` exposes the `individual-consultations` portal (list/detail/messages/invoice) as **read-only**; there is no `individual-consultations/book`. So the old individual-consultation *booking* mock flow is intentionally NOT wired — those bookings are created server-side/by other means. The portal (viewing + chat) IS wired (Phase 3).

### Phase 9 cleanup — deleted (9 files, verified zero remaining imports; tsc + tests green after)

- `src/features/account/components/account-sections/{trips-page,consultations-page,clinic-bookings-page,health-assessments-page}.tsx` — routes repointed to the wired feature components.
- `src/features/learning/services/certificate.service.ts` + `types/certificate.types.ts` — legacy jsPDF/localStorage cert, superseded by the backend certificate endpoint; the certificate-eligibility block was removed from `enrollment.service.test.ts`.
- `src/features/health-assessment/services/health-assessment-config.service.ts` — mock form schema, replaced by the `health-assessments/form` endpoint.
- `src/features/search/services/search-index.service.ts` + its `.test.ts` — replaced by the live search API.

### Intentionally kept (still referenced — not orphaned)

`src/features/care/services/*`, `consultations/data/booking-slots.mock.ts`, `consultations/services/booking-slots.service.ts`, and `consultations/components/{individual,package}-booking-flow.tsx` — these power the **individual-consultation mock booking**, which has **no backend endpoint** and is the only implementation available. The shared `checkout-page.tsx` monolith also still references the care mock for its (now-unrouted) `consultation-session`/`consultation-package` branches. Removing this chain would require a product decision on the individual/package consultation booking, so it was left intact.

---

## 0. Context & scope

The `git pull` brought the backend up to date with several **new client-facing modules** that the frontend has UI scaffolds for but **does not actually call** (confirmed: zero `apiFetch` usage in the affected features — they run on local mock/`localStorage` layers, primarily `src/features/care/*`, `search-index.service`, `payments-storage.service`, and `health-assessment-config.service`).

### Gap summary

| # | Backend module | Frontend today | Effort |
|---|----------------|----------------|--------|
| 1 | **Clinics** (catalog, working-hours, slots, initial-consultation + appointment booking) | `features/clinic` → `care` mock | 🔴 Large |
| 2 | **Trips** (catalog, purchase, initial consultation, account trip-packages) | `features/trips` → `care` mock | 🔴 Large |
| 3 | **Care portals** (clinic-initial-consultations, clinic-appointments, individual-consultations, trip-initial-consultations — list/detail/messages/invoice) | `features/consultations` → `localStorage` + fake replies | 🔴 Large |
| 4 | **Global search** (`/search`) | `features/search` → local search-index | 🟡 Medium |
| 5 | **Account payments + invoices** (`/account/payments`, per-feature invoice PDFs) | `features/payments` → `localStorage` | 🟡 Medium |
| 6 | **Encyclopedia taxonomy filters** (news-types, herbal families/species/genera/origins + `filters[*_id]`) | `features/library` hardcoded options, client-side filtering | 🟡 Medium |
| 7 | **Health assessments** (form/index/store/show) | `features/health-assessment` → local config + `localStorage` | 🔴 Large |
| 8 | **Course certificate / invoice polish** | Wired happy-path; error keys + legacy jsPDF cleanup | 🟢 Small |
| 9 | **Community / research** | ✅ Already fully wired | 🟢 None (cleanup only) |

### Non-negotiable constraints

- Do **not** modify anything under `/backend`.
- Feature code lives under `src/features/[name]/`, **not** root `features/`.
- Keep `src/app/` routes thin — logic lives in feature components/hooks.
- All backend state goes through `apiFetch<T>` (`src/lib/api/base-fetch.ts`) — it normalizes `/api/user/...` → `/api/v1/user/...`, attaches the `b3_api_token` Bearer, and unwraps the `{ key, msg, data }` envelope.
- Binary downloads (invoices, certificates) use `downloadAuthenticatedFile` (`src/lib/api/download.ts`) — **never** `apiFetch` (those endpoints return PDFs, not JSON).
- React Query for server state; **every feature owns `query-keys.ts`** (no inline key arrays).
- Forms: `react-hook-form` + `zod`. Feedback: `toastSuccess`/`toastError` (no inline banners). Mutation buttons disabled + spinner while pending.
- Run `npm run lint`, `npm run typecheck`, and `npm test` after each phase (all touch data contracts/forms/routes).

---

## ✅ Full backend-route coverage audit (every client route)

Audited **every** route in `backend/routes/Api/user.php` + `general.php` (the complete client API; `web.php` is the admin Blade dashboard) against the frontend and the business specs in `backend/docs/actors/موقع_العميل/`. **Every user.php endpoint is implemented and — after the fixes below — correct.** Two cross-cutting gaps were found and fixed:

- **Locale header (was: all API content returned in English).** The backend localizes responses from the `Accept-Language` header (`SetLocaleFromHeader`, default `en`), but `apiFetch`/`downloadAuthenticatedFile` never sent it. Fixed: both now send `Accept-Language` from the persisted UI language (`b3_lang`), so Arabic users get Arabic API content.
- **Payment gateway return pages (was: 404 after real payment).** After MyFatoorah checkout, the backend redirects the browser to `FRONT_URL + /order-success | /order-fail | /order-pending` (`myfatoorah.callback_redirect_urls`). Added those three routes (`src/app/(site)/order-*`) rendering a shared `PaymentResultPage`.

**Decision items (not bugs — intentional / server-side):**
- `general/ai-assistant` (GET/POST) — unused; the frontend uses its own Next.js AI route (`src/app/api/ai/chat/route.ts`).
- `general/change-lang` — not called; per-request localization is handled by the `Accept-Language` header. (Optional: call it to persist the user's language for backend emails/push.)
- Individual/package **consultation booking** (business features 18–21, 43) — no backend booking endpoints exist; only the read/chat portal does (wired). Bookings are created server-side.
- **Favorites** (feature 48) — no backend endpoint; client-side only, matching the backend.

---

## 1. Shared conventions (read once)

### Envelope & pagination
- Success envelope `{ key, msg, data }` → `apiFetch` returns `data`.
- Paginated `data` is `{ items: T[], pagination: { current_page, last_page, per_page, total } }`.
  Use the existing `asArray()` / `Paginated<T>` tolerance pattern from `courses-api.service.ts` (accepts `items` **or** `data` **or** a bare array). For paginated UIs, also read `pagination`.

### The reference pattern (mirror `features/courses` and `features/books`)
Each wired feature has:
```
src/features/<name>/
  query-keys.ts                 # typed key factory, no inline arrays
  types/api.types.ts            # normalized camelCase FE types
  services/<name>-api.service.ts# apiFetch calls + mapXxx() defensive mappers
  hooks/use-<name>-api.ts       # React Query useQuery/useMutation wrappers
  ui/ or components/            # presentational, consume hooks
```
Mapper helpers to reuse verbatim (copy from `courses-api.service.ts`): `text()` (tolerates `{ar,en}` localized objects **and** plain strings — backend now returns plain localized strings for most fields, but keep tolerance), `numberValue()`, `asArray()`.

### Money / booking bodies
- Booking/purchase POST bodies take `payment_method_id` (int, must be active), `currency` (in supported list, default `KWD`), and `idempotency_key` (≤100 chars). Pass idempotency via the `X-Idempotency-Key` header **and** body field, mirroring `checkoutCourse()`.
- `payment_methods` come from the already-wired `GET /payment-methods` (`features/subscriptions`/checkout).

### Invoices & certificates (all binary PDF)
- Service files expose **URL builders** returning relative `/api/user/...` paths (mirror `getMyCourseInvoiceUrl`), consumed by `downloadAuthenticatedFile(url, 'invoice.pdf')`.
- **Bug to fix (Phase 0):** `getMyBookInvoiceUrl` in `books-api.service.ts` currently builds an **absolute** `/api/user/...` URL, which bypasses the `/api/v1` normalization in `resolveApiUrl` → the download hits the wrong path. Change it to a **relative** path.

---

## Phase 0 — Foundations & fixes (do first)

**Objective:** land the small shared pieces every later phase depends on.

1. **Fix invoice URL bug** — `src/features/books/services/books-api.service.ts`: change `getMyBookInvoiceUrl(orderId)` to return the relative path `/api/user/my-books/${orderId}/invoice` (not an absolute URL) so `resolveApiUrl` normalizes it to `/api/v1/user/...`.
2. **Add shared invoice URL helpers** where each feature will need them (created in their phases, listed here for reference):
   - `getTripPackageInvoiceUrl(order)` → `/api/user/account/trip-packages/${order}/invoice`
   - `getClinicInitialConsultationInvoiceUrl(id)` → `/api/user/clinic-initial-consultations/${id}/invoice`
   - `getClinicAppointmentInvoiceUrl(id)` → `/api/user/clinic-appointments/${id}/invoice`
   - `getIndividualConsultationInvoiceUrl(id)` → `/api/user/individual-consultations/${id}/invoice`
   - `getTripInitialConsultationInvoiceUrl(id)` → `/api/user/trip-initial-consultations/${id}/invoice`
3. **Confirm download UX** — `downloadAuthenticatedFile` already exists and is correct; wrap call sites in try/catch to `toastError` on failure (used by cert/invoice buttons).

**Acceptance:** book invoice download resolves to `/api/v1/user/my-books/{order}/invoice`; lint/typecheck green.

---

## Phase 1 — Clinics (catalog + booking)

**Backend (all `/api/v1/user/`; catalog GETs are PUBLIC, booking POSTs need auth):**

| Method | Path | Notes |
|---|---|---|
| GET | `clinics` | paginated `ClinicResource` `{id,name,image,address,short_description,category:{id,name}?}`; `?per_page`, `?search` |
| GET | `clinics/categories` | array `{id,name}` |
| GET | `clinics/services` | array `{id,name,description,image}` |
| GET | `clinics/{id}` | detail: `+description, services, doctor{id,name,image,short_bio}?, working_hours[], is_favorited`; **when authed:** `initial_consultation{status,status_label,can_book,care_booking_id,payment_ref,portal_state}`, `has_completed_initial_consultation`, `can_book_in_clinic` |
| GET | `clinics/{id}/working-hours` | `[{day,day_label,is_off,periods:[{start_time,end_time}]}]` |
| GET | `clinics/{id}/initial-consultation-types` | `{clinic_id,duration_minutes,types:[{type,type_label,is_available,price,duration_minutes,minimum_booking_lead_days}]}` (`type` = `clinic_text_initial_consultation`\|`clinic_video_initial_consultation`) |
| GET | `clinics/{id}/available-slots` | query **required** `date`=`Y-m-d`, `type`∈`in_clinic`,`clinic_text_initial_consultation`,`clinic_video_initial_consultation` → `{clinic_id,date,type,type_label,minimum_booking_lead_days,duration_minutes,slots:[{start_time,end_time}]}` |
| POST | `clinics/{id}/initial-consultation/book` | body `{type:'text'\|'video', appointment_date, start_time, payment_method_id, currency, idempotency_key, user_name, user_email, user_phone, notes?, simulate_result?}` → `{payment:PaymentTransaction, care_booking:CareBooking?}` |
| POST | `clinics/{id}/initial-consultation/fulfill-slot` | body `{payment_ref, appointment_date, start_time}` (used when `requires_slot_selection`) |
| POST | `clinics/{id}/appointments/book` | same as IC book **minus `type`** (booking_type resolves to `in_clinic`); gated server-side on completed IC |
| POST | `clinics/{id}/appointments/fulfill-slot` | `{payment_ref, appointment_date, start_time}` |

> ⚠️ Enum gotcha: the **book** body uses `InitialConsultationTypeEnum` = `text`/`video`, while **available-slots** uses `CareBookingTypeEnum` = `clinic_text_initial_consultation`/`clinic_video_initial_consultation`. Map between them in the service.

**Files to create:**
- `src/features/clinic/query-keys.ts` — `list(filters)`, `categories`, `services`, `detail(id)`, `workingHours(id)`, `initialConsultationTypes(id)`, `availableSlots(id,date,type)`.
- `src/features/clinic/types/api.types.ts` — `ClinicListItem`, `ClinicDetail`, `ClinicCategory`, `GeneralClinicService`, `WorkingHours`, `InitialConsultationTypes`, `AvailableSlots`, `CareBooking`, `PaymentTransaction`, plus booking input types.
- `src/features/clinic/services/clinics-api.service.ts` — `getClinics`, `getClinicCategories`, `getClinicServices`, `getClinicDetail`, `getClinicWorkingHours`, `getInitialConsultationTypes`, `getClinicAvailableSlots` + `mapClinic`/`mapClinicDetail` mappers.
- `src/features/clinic/services/clinic-booking-api.service.ts` — `bookInitialConsultation`, `fulfillInitialConsultationSlot`, `bookClinicAppointment`, `fulfillAppointmentSlot` (send `X-Idempotency-Key`).
- `src/features/clinic/hooks/use-clinics-query.ts` + `use-clinic-booking.ts`.

**Files to modify:**
- `clinic-page.tsx` — replace `getActiveClinics()`/`GENERAL_CLINIC_SERVICES` with `useClinics`/`useClinicServices`/`useClinicCategories`; push search/category into query params.
- `clinic-detail-page.tsx` — replace `getClinicById` + `care-prerequisite.service` with `getClinicDetail(id)`; drive CTAs off `initial_consultation`, `has_completed_initial_consultation`, `can_book_in_clinic`.
- `clinic-booking-flow.tsx` — replace mock slots + `canBookClinicAppointment` guard with `getClinicAvailableSlots` + server flags.
- Booking submission (in `features/checkout/components/checkout-page.tsx`, `type==='clinic-appointment'`) — replace mock `createPaymentIntent`/`addStoredClinicBooking` with real POST `book`; when `payment.requires_slot_selection` → follow up with `fulfill-slot`; when `payment.payment_url` present (pending gateway) → redirect.

**Acceptance:** clinic list/detail render from API; a booking POST creates a real transaction; slot-selection + pending-gateway paths handled.

---

## Phase 2 — Trips (catalog + purchase + initial consultation + account packages)

**Backend (catalog GETs PUBLIC; the rest need auth; none behind `subscription.required`):**

| Method | Path | Notes |
|---|---|---|
| GET | `trips/categories` | array `{id,name}` |
| GET | `trips/featured` | paginated `TripPackageListResource` |
| GET | `trips` | paginated; `?per_page`, `?search` |
| GET | `trips/{id}` | detail = list shape + `description` + `existing_order?` |
| GET | `trips/initial-consultation/types` | `{clinic_id,duration_minutes,types:[{type:'text'\|'video',type_label,is_available,price,duration_minutes,minimum_booking_lead_days}]}` |
| GET | `trips/initial-consultation/available-slots` | query **required** `date`=`Y-m-d`, `type`∈`trip_text_initial_consultation`,`trip_video_initial_consultation` |
| POST | `trips/initial-consultation/book` | body `{type:'text'\|'video', appointment_date, start_time, payment_method_id, currency, idempotency_key, user_name/email/phone, notes?, simulate_result?}` |
| POST | `trips/initial-consultation/fulfill-slot` | `{payment_ref, appointment_date, start_time}` |
| POST | `trips/{id}/purchase` | body `{payment_method_id, currency, idempotency_key, simulate_result?}` → `{payment, trip_package_order?}` (server enforces IC prerequisite) |
| GET | `trip-initial-consultations` (+ `/{id}`, `/{id}/messages` GET/POST, `/{id}/invoice`) | portal — same shapes as clinic care portals (see Phase 3) |
| GET | `account/trip-packages` (+ `/{order}`, `/{order}/invoice`) | paginated `TripPackageOrderResource` `{id,trip_package_id,package_name,package_snapshot,amount,currency,status,status_label,purchased_at,payment_transaction?,invoice?}` |

**`TripPackageListItem`:** `{id,name,short_description,image,location,duration,price,features:string[],is_featured,max_buyers,buyers_count,remaining_spots,is_fully_booked,is_available_for_purchase,category:{id,name}?,is_purchased,can_purchase,requires_trip_initial_consultation}`.

> ⚠️ Same enum split as clinics: **book** body = `text`/`video`; **available-slots** = `trip_text_initial_consultation`/`trip_video_initial_consultation`.

**Files to create:**
- `src/features/trips/types/api.types.ts`, `src/features/trips/services/trips-api.service.ts`, `src/features/trips/hooks/use-trips-api.ts`.
- Trip IC portal route(s) under `src/app/(account)/...` mirroring the clinic IC portal.

**Files to modify:**
- `trips/query-keys.ts` — add `featured(limit)`, `categories`, `initialConsultationTypes`, `availableSlots(date,type)`, `consultations()`, `consultation(id)`, `consultationMessages(id)`, `accountOrders()`, `accountOrder(id)`.
- `trips-page.tsx` — replace `getActiveTripPackages`/`getFeaturedTripPackages`/`getTripPlaces`/`trip-capacity.service` with hooks; adapt filters to backend fields (`location`, `duration`, `remaining_spots`, `is_fully_booked`); use `can_purchase`/`requires_trip_initial_consultation`.
- `trip-detail-page.tsx` — `useTripPackageDetail`; CTA off `can_purchase`/`is_purchased`/`existing_order`/`requires_trip_initial_consultation`; purchase via `trips/{id}/purchase`.
- `app/(site)/trips/[tripId]/initial-consultation/page.tsx` — use `types` + `available-slots`, submit via `book` (+ `fulfill-slot`).
- `app/(account)/dashboard/trips/page.tsx` — wire to `getAccountTripPackages` + invoice URL builder.

**Mapper mismatches to bridge:** backend `name`/`location`/`duration`/`features:string[]` vs mock `title`/`place`/`durationDays`/`features:{en,ar}[]`; capacity from `remaining_spots`/`is_fully_booked`/`max_buyers`/`buyers_count`.

**Acceptance:** trips catalog/detail from API; purchase posts real transaction and respects IC prerequisite; account trip-packages list + invoice download work.

---

## Phase 3 — Care portals (bookings, consultations, chat)

Four portal resources share identical shapes (`BaseCareBookingPortalController`); they differ only in booking-type filter:
- `clinic-initial-consultations` → `clinic_text/video_initial_consultation` (has messages)
- `clinic-appointments` → `in_clinic` (**no messages**)
- `individual-consultations` → `individual_text/video_consultation` (has messages)
- `trip-initial-consultations` → `trip_text/video_initial_consultation` (has messages) — built in Phase 2

**Endpoints (per resource):**
| Method | Path | Response |
|---|---|---|
| GET | `{resource}` | paginated `CareBookingListResource` `{id,booking_type,booking_type_label,status,status_label,appointment_date,start_time,end_time,requires_slot_selection,payment_ref,amount,currency,payment_status,payment_status_label,payment_method}` |
| GET | `{resource}/{id}` | `CareBookingDetailResource` = full booking + `session:{url,can_join}` + `portal:{state,can_interact,can_prepare}` |
| GET | `{resource}/{id}/messages` | paginated `RoomMessageResource` `{id,type,body,is_admin_message,sender_name,is_deleted,created_at}` |
| POST | `{resource}/{id}/messages` | body `{body}` (≤5000) → 201 `RoomMessageResource`; 403 if portal not interactive |
| GET | `{resource}/{id}/invoice` | binary PDF |

**Files to create:**
- `src/features/consultations/query-keys.ts` — list/detail/messages keys per resource.
- `src/features/consultations/types/api.types.ts` — `CareBookingListItem`, `CareBookingDetail`, `RoomMessage`, portal/session state.
- `src/features/consultations/services/care-portal-api.service.ts` — generic `getPortalList(resource, {perPage,page})`, `getPortalDetail(resource,id)`, `getPortalMessages(resource,id,page)`, `sendPortalMessage(resource,id,body)`, + invoice URL builders.
- `src/features/consultations/hooks/use-care-portal.ts` — queries + send-message mutation (invalidate messages on success).

**Files to modify:**
- `chat-consultation.tsx` — replace `consultation-chat-storage.service` (localStorage + fake `setTimeout` reply) with messages GET/POST; gate composer on `portal.can_interact`; poll/refetch messages.
- `consultation-detail.tsx` + `app/(account)/dashboard/consultations/page.tsx` + `app/(account)/consultation/[consultationId]/*` — replace `care-records-storage` reads with portal list/detail queries.
- `app/(account)/dashboard/clinic-bookings/page.tsx` + `clinic-booking-detail.tsx` — wire to `clinic-appointments` + `clinic-initial-consultations` portals.

**Acceptance:** consultation/booking lists + detail render from API; chat sends/receives real messages gated by portal state; invoice PDFs download.

---

## Phase 4 — Global search

**Backend:** `GET /search` (PUBLIC). Query `q` (**required**, min 2, max 120), `per_group` (1–20, default 5). Response:
```
{ query, total_results, groups:[ { key, label, count, items:[ { type, id, title, description?, image?, endpoint, requires_auth, requires_subscription, meta{} } ] } ] }
```
Group keys/types: `courses/course`, `books/book`, `encyclopedia_news`, `herbal_library`, `articles/article`, `theories/theory`, `research`, `clinics/clinic`, `trips/trip`, `plants_fungi/plant_fungi`, `podcast/podcast_episode`, `faqs/faq`. `endpoint` is an **API** path — the frontend maps `type` → **site** route.

**Files to create:**
- `src/features/search/services/search-api.service.ts` — `searchGlobal({q,perGroup})` → `apiFetch('/api/user/search',{query:{q,per_group}})`.
- `src/features/search/types/search.types.ts` — response DTOs + `SEARCH_TYPE_ROUTES` map (`type`→site path, e.g. `course`→`/courses/{id}`, `herbal_library`→`/education/encyclopedia/{id}`, etc.).
- `src/features/search/hooks/use-global-search.ts` — `useQuery` keyed by `searchKeys.query(term)`, `enabled: term.trim().length>=2`, debounced input.

**Files to modify:**
- `search-page.tsx` — replace `searchSite`/`groupSearchResults` with the hook; render backend `groups[].label`/`items[]`; map `type`→route; loading/empty/error states; badge `requires_subscription`.
- (Optional) keep `search-index.service.ts` as an offline fallback or retire it.

**Acceptance:** typing ≥2 chars queries the API (debounced); results grouped and link to correct site routes.

---

## Phase 5 — Account payments & invoices

**Backend:** `GET /account/payments` (auth). Query `per_page` (default 15). Paginated `AccountPaymentResource`:
```
{ id, type, type_label, content_name?, date, amount, currency,
  payment_method:{id,driver,name,image}, status, status_label,
  invoice?:{ invoice_number, qr_code_url, web_view_url, pdf_download_url, image_download_url }, // only when status=success
  related_endpoint? }
```
`type` ∈ subscription/book/course/trip_package/clinic_initial_consultation/clinic_appointment/individual_consultation/trip_initial_consultation/care_booking/payment.
> The embedded `invoice.pdf_download_url` is a **public** (no-auth) URL → a plain `<a download>` works. Per-feature invoice endpoints (Phase 0/1/2/3) are the authenticated alternative.

**Files to create:**
- `src/features/account/services/account-payments-api.service.ts` — `getAccountPayments({perPage,page})` → `{items,pagination}` + mapper.
- `src/features/account/types/account-payment.types.ts` — `AccountPaymentApiItem`, `AccountPaymentInvoice`, `PaymentPagination`.
- `src/features/account/hooks/use-account-payments.ts` — paginated `useQuery`.

**Files to modify:**
- `account/query-keys.ts` — add `payments(page?)`.
- `account-sections/payments-page.tsx` — consume backend fields; invoice download from `invoice.pdf_download_url` (or `downloadAuthenticatedFile` on the per-feature endpoint); map `related_endpoint`→site route for view/retry; pagination controls; `toastError` on failure.

**Acceptance:** payments table renders from API with working invoice downloads and pagination.

---

## Phase 6 — Encyclopedia taxonomy filters

**Backend (PUBLIC):** `encyclopedia/news-types`, `encyclopedia/herbal/{families|species|genera|origins}` → each `{id,name}[]`. Filtering on the list endpoints uses the **`filters[...]` query bag**:
- Herbal list: `filters[search]`, `filters[family_id]`, `filters[species_id]`, `filters[genus_id]`, `filters[origin_id]`.
- News list: `filters[search]`, `filters[encyclopedia_news_type_id]`.

**Files to modify:**
- `library/services/encyclopedia-api.service.ts` — add `getEncyclopediaNewsTypes`, `getHerbalFamilies/Species/Genera/Origins`; change herbal/news list calls to send the `filters[...]` bag (fix: currently sends flat `search`, no ids).
- `library/hooks/use-encyclopedia-api.ts` + `library/query-keys.ts` — add taxonomy list hooks/keys.
- `library/components/encyclopedia-list.tsx` — replace hardcoded `type/family/sex/origin` dimensions + `getHerbFilterOptions()` mock with backend-driven `family/species/genus/origin` dropdowns feeding the API `*_id` params. Retire `sex`/`type` mock dimensions.
- Extend `EncyclopediaHerbFilters` type with `familyId/speciesId/genusId/originId`.

**Acceptance:** dropdown options come from the taxonomy endpoints; selecting one filters via the API (server-side), not client-side mock.

---

## Phase 7 — Health assessments

**Backend (auth):**
| Method | Path | Notes |
|---|---|---|
| GET | `health-assessments/form` | `[{id, name:{ar,en}, conditions:[{id, name:{ar,en}}]}]` (dynamic schema) |
| POST | `health-assessments` | body `{answers:[{condition_id:int, answer:'not_present'\|'present'\|'chronic'}]}` → 201 submission |
| GET | `health-assessments` | paginated `[{id,status,sections_count,conditions_count,answers:null,created_at}]` |
| GET | `health-assessments/{id}` | full submission incl. nested `answers:[{id,name,conditions:[{id,name,answer:{value,label}?}]}]` |

**Files to create:**
- `health-assessment/services/health-assessment-api.service.ts` — `getHealthAssessmentForm`, `submitHealthAssessment(answers)`, `getHealthAssessmentSubmissions`, `getHealthAssessmentSubmission(id)`.
- `health-assessment/types/health-assessment.types.ts` — `FormSection`, `SubmissionAnswer`, list/detail shapes.
- `health-assessment/hooks/use-health-assessment.ts` + `health-assessment/query-keys.ts`.

**Files to modify:**
- `health-assessment-page.tsx` + `health-assessment-form.tsx` — drive the form from the `form` endpoint's real `condition_id`s (zod + react-hook-form); map UI `0|1|2` → `not_present|present|chronic`; POST to `store` instead of `addHealthAssessmentRecord()`. Decide fate of unsupported `additionalNotes` (drop — no backend field).
- Account history view + `app/(account)/dashboard/health-assessments/page.tsx` — read from `GET health-assessments`/`{id}` instead of `account-records.service`.
- (Optional) retire `health-assessment-config.service.ts` mock once API-driven.

**Acceptance:** form renders from backend schema; submission posts real `condition_id`/enum answers; history reads from API.

---

## Phase 8 — Course certificate & invoice polish

The certificate/invoice happy path is **already wired** (`getMyCourseCertificateUrl` + `downloadAuthenticatedFile`). Remaining:
- Wrap cert/invoice download calls (`courses-page.tsx`, `course-player.tsx`) in try/catch → surface backend 404 keys (`course_certificate_not_issued_yet`, `course_certificate_not_enabled`, `course_certificate_unavailable`) as friendly `toastError`.
- Retire legacy client-side `features/learning/services/certificate.service.ts` + `certificate.types.ts` (jsPDF/localStorage) to avoid divergence from the real issued certificate.

Also fold in still-open items from `BACKEND_FRONTEND_ALIGNMENT_GAPS.md` (Jul 8) where not already closed: per-section checkout payable sections, quiz-id vs lesson-id on quiz lessons, final-quiz rendering, group-chat message ownership. Verify each against current code before acting (several may already be resolved).

---

## Phase 9 — Cleanup & verification

Once features are on the API:
- Remove/quarantine dead mock layers: `features/care/services/*` (data/records/slots/lifecycle/chat-storage), `consultations/data/booking-slots.mock.ts`, `search-index.service.ts` (if not kept as fallback), `payments-storage.service.ts`, `health-assessment-config.service.ts`, superseded `community/services/community-content.service.ts`/`community-sections.service.ts`. Keep only genuinely still-needed pure logic.
- Update/add tests mirroring `*-api.service.test.ts` conventions for each new service.
- `npm run lint && npm run typecheck && npm test` clean.
- Manual smoke per feature against the live backend (`NEXT_PUBLIC_API_BASE_URL`).

---

## Suggested execution order

`Phase 0` → `Phase 1 (Clinics)` → `Phase 3 (Care portals)` → `Phase 2 (Trips, reuses portal layer)` → `Phase 5 (Payments/invoices)` → `Phase 4 (Search)` → `Phase 6 (Encyclopedia)` → `Phase 7 (Health)` → `Phase 8 (Cert polish)` → `Phase 9 (Cleanup)`.

Rationale: clinics establish the care booking/portal pattern; care portals are shared by trips; payments/invoices tie the booking outputs together; search/encyclopedia/health are independent and can slot in anytime; cleanup last.

---

## Per-phase Definition of Done

- [ ] Service functions call real endpoints via `apiFetch` (or `downloadAuthenticatedFile` for PDFs).
- [ ] Types match the backend resource shape; mappers tolerate missing/localized fields.
- [ ] `query-keys.ts` owns all keys; hooks wrap queries/mutations with toast feedback.
- [ ] Components consume hooks; mock/localStorage reads for that feature removed.
- [ ] Loading / empty / error states handled; mutation buttons disabled while pending.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` pass.
