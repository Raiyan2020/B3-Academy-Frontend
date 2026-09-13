# Backend API Delta — `0937817..dfd368c`

**Correction notice:** an earlier version of this report used the range `3e95515^..dfd368c`, which was wrong — `3e95515` itself came in with this pull (`git merge-base --is-ancestor 3e95515 'HEAD@{1}'` is false), so that range silently dropped the first two commits of the pull, including the entire **Favorites** feature and six one-line `is_favorited` additions to detail resources. This version uses the verified correct range **`0937817..dfd368c`** throughout, confirmed via `git log --oneline 0937817..dfd368c`.

```
dfd368c Merge pull request #49 from Raiyan2020/feature/19-individual-consultation-booking
83aa0e3 feat: implement individual consultation booking feature
6b40b10 Merge pull request #48 from Raiyan2020/18_consultations_catalog
e7c5bc9 feat: implement consultations catalog API with doctor and consultation type management
a0240ef fix: update consultation packages route generation for doctor filtering
c863aa4 feat: update consultation package management with improved doctor selection handling and new documentation
1059b4d Merge pull request #47 from Raiyan2020/26_admin_consultation_packages
8b683d8 feat: implement consultation packages management module with CRUD functionality
619e255 Merge pull request #46 from Raiyan2020/24_admin_consultation_doctors
6237d41 feat: implement consultation doctors management module with CRUD functionality
ab13020 feat: enhance activity logs with new filtering options, pagination, and UI improvements
3e95515 feat: integrate Spatie activity log package and implement activity logging across various models and controllers
4c8a86d Merge pull request #45 from Raiyan2020/feature/01_admin_dashboard
06d7079 feat: enhance dashboard charts with shared options and localization updates; refactor chart rendering for improved maintainability
aca68df feat: add admin statistics page with KPIs, charts, and date filters; refactor home dashboard for improved summary and user experience
9b7c363 feat: add admin dashboard statistics page and refresh home analytics
31bee0e feat: enhance permission management by adding new modules and permissions ...
83cb705 Merge pull request #44 from Raiyan2020/feature/48-favorites
db21d8c feat: implement favorites feature with API endpoints, service logic, and resource handling for user favorites management
```

`git diff --name-status 0937817 dfd368c` (full list, worked from directly) shows changes across `app/`, `routes/Api/user.php`, `database/migrations/`, dashboard-only Blade/JS/CSS, and tests. Only `routes/Api/user.php` changed under `routes/Api/` (28 lines: 26 insertions / 2 whitespace-only deletions).

## Summary

- **New user-facing feature: Favorites.** Authenticated users can list, toggle (add/remove), and delete favorites across 7 favoritable content types (courses, books, encyclopedia news, herbal library entries, clinics, trip packages, plant/fungi entries). New prefix: `/api/v1/user/favorites`. Backed by new `favorites` table, `Favorite` model, `FavoriteFavoritableTypeEnum`, `FavoriteService`.
- **Consequence of Favorites: `is_favorited` (bool) added to 6 detail resources, and a pre-existing hardcoded field fixed in a 7th.** Every "show one item" endpoint across Books, Courses, Encyclopedia (news + herbal), Plants/Fungi, Clinics, and Trip Packages now calls `FavoriteService::appendFavoriteState()` before building the resource, so the resource's `is_favorited` reflects the current user's actual favorite state (or `false` for guests). **Additive/fix only — no field renamed or removed.** Full breakdown in "Breaking changes" below.
- **New user-facing feature: Consultations Catalog.** Public browsing of doctors offering 1:1 (individual) consultations, their consultation types (text/video), open slots, and purchasable consultation packages. New prefix: `/api/v1/user/consultations-catalog`.
- **New user-facing feature: Individual Consultation Booking.** Authenticated booking of a text/video individual consultation with a doctor, plus a "fulfill slot" flow for a payment that succeeded after its original slot was taken. Reuses the existing `CareBooking`/`PaymentTransaction` machinery and existing `individual-consultations` portal routes (unchanged in this range).
- Everything else in the diff is **admin/dashboard-only**, noted but not detailed further since none of it is under `/api/...`: Activity Log module (new `spatie/laravel-activitylog`-backed `activity_log` table, `ActivityLogController`, Blade UI), Admin **Consultation Doctors** management, Admin **Consultation Packages** management, and a new Admin **Statistics** dashboard page (`StatisticsController`, KPI/chart Blade components, `DashboardStatisticsService`).
- Three new DB tables back user-facing endpoints: `favorites`, `doctor_individual_consultation_configs`, `consultation_packages` (all three surface directly in API responses — see Migrations section).
- No API docs (`.md`/Postman/OpenAPI/Swagger) were added anywhere in this range: `git diff --name-only 0937817 dfd368c | grep -iE '\.md$|postman|openapi|swagger'` returned nothing (only renamed internal `docs/actors/.../analysis_fragment.md` / `feature_name.md` planning notes moved into `00_finished/` subfolders — not API docs).

## New endpoints

All paths are prefixed `/api/v1/user/...` (`routes/api.php`: `Route::prefix('v1')->...->group()` → `Route::prefix('user')->group(fn () => require 'Api/user.php')`, unchanged).

| Method | Path | Auth | Controller@method | Purpose |
|---|---|---|---|---|
| GET | `/api/v1/user/favorites` | `auth:user` + `api.account.access` | `FavoriteController@index` | Paginated list of the current user's favorites, optionally filtered by `type` |
| POST | `/api/v1/user/favorites/toggle` | `auth:user` + `api.account.access` | `FavoriteController@toggle` | Add the favorite if not present, remove it if present |
| DELETE | `/api/v1/user/favorites/{id}` | `auth:user` + `api.account.access` | `FavoriteController@destroy` | Delete a favorite by its own id (404 if it belongs to another user) |
| GET | `/api/v1/user/consultations-catalog/doctors` | public | `ConsultationsCatalogController@doctors` | Paginated list of doctors with an active clinic, offering individual consultations |
| GET | `/api/v1/user/consultations-catalog/doctors/{doctorId}/consultation-types` | public | `ConsultationsCatalogController@consultationTypes` | Text/video individual consultation types available for a doctor, with price/availability |
| GET | `/api/v1/user/consultations-catalog/doctors/{doctorId}/available-slots` | public | `ConsultationsCatalogController@availableSlots` | Available time slots for a doctor on a given date, for a given consultation type |
| GET | `/api/v1/user/consultations-catalog/doctors/{doctorId}/packages` | public | `ConsultationsCatalogController@packages` | Paginated list of a doctor's active consultation packages |
| POST | `/api/v1/user/consultations-catalog/doctors/{doctorId}/book` | `auth:user` + `api.account.access` | `IndividualConsultationController@book` | Book (checkout) an individual text/video consultation with a doctor |
| POST | `/api/v1/user/consultations-catalog/doctors/{doctorId}/fulfill-slot` | `auth:user` + `api.account.access` | `IndividualConsultationController@fulfillSlot` | Complete a booking whose payment succeeded after its original slot was taken |

`{doctorId}` is constrained `->whereNumber('doctorId')` on all consultations-catalog routes; `{id}` on `DELETE favorites/{id}` is constrained `->whereNumber('id')`.

Note: `IndividualConsultationPortalController` routes (`individual-consultations` — index/show/messages/invoice) already existed prior to this range and are unchanged.

## Changed endpoints

No route's URI, HTTP method, or middleware group changed. The following existing endpoints have a **behavior/response-body change only** (same URL, same method), because their controllers now inject `is_favorited` state:

| Method | Path | Controller@method | What changed |
|---|---|---|---|
| GET | `/api/v1/user/books/{id}` | `BookController@show` | Response now includes real `is_favorited` (see Breaking changes) |
| GET | `/api/v1/user/courses/{id}` | `CourseController@show` | Response now includes real `is_favorited` |
| GET | `/api/v1/user/clinics/{id}` | `ClinicController@show` | `is_favorited` now computed instead of hardcoded `false` |
| GET | `/api/v1/user/encyclopedia/news/{id}` | `EncyclopediaController@showNews` | Response now includes real `is_favorited` |
| GET | `/api/v1/user/encyclopedia/herbal/{id}` | `EncyclopediaController@showHerbal` | Response now includes real `is_favorited` |
| GET | `/api/v1/user/plants-fungi/{id}` | `PlantFungiEncyclopediaController@show` | Response now includes real `is_favorited` |
| GET | `/api/v1/user/trips/{id}` | `TripCatalogController@show` | Response now includes real `is_favorited` |

Only the single-item `show` endpoints for these 7 domains changed. Their `index`/list endpoints were **not** touched — `is_favorited` is not present on list-item resources in this range (verified: no diff hunk touches a list Resource for any of these controllers).

## Response shapes

App-wide envelope (`App\Traits\ResponseTrait::jsonResponse`, unchanged in this range):

```json
{
  "key": "success",
  "msg": "string",
  "code": 200,
  "response_status": { "error": false, "validation_errors": [] },
  "data": { }
}
```

Paginated list endpoints wrap `data` via `App\Traits\PaginationTrait::paginatedData` (unchanged):

```json
{
  "items": [ /* Resource::collection */ ],
  "pagination": { "current_page": "int", "last_page": "int", "per_page": "int", "total": "int" }
}
```

### `FavoriteResource` (NEW)

File: `app/Http/Resources/Api/Favorites/FavoriteResource.php`. Used by `GET /api/v1/user/favorites`.

```json
{
  "id": "int",
  "type": {
    "...": "FavoriteFavoritableTypeEnum::getFullObj() shape — value + translated label; exact field names not re-derived in this pass (EnumRetriever trait, pre-existing helper)"
  },
  "favorited_at": "string (Y-m-d H:i:s)",
  "item": {
    "id": "int",
    "title": "string|null (locale-resolved: current locale, then en, then ar)",
    "image": "string|null",
    "is_available": "bool",
    "can_open": "bool",
    "unavailable_reason": "string|null ('disabled_or_deleted' | 'subscription_required' | null)",
    "requires_subscription": "bool",
    "redirect_hint": "string|null ('subscriptions' | null)",
    "detail_endpoint": "string (e.g. '/api/v1/user/courses/{id}')"
  }
}
```
`is_available`/`can_open`/`unavailable_reason`/`redirect_hint` come from `FavoriteService::resolveAccessState()`: a favorited item that was deleted/deactivated shows `is_available: false, can_open: false, unavailable_reason: 'disabled_or_deleted'`; a `plant_fungi_entry` favorited without an active subscription shows `is_available: true, can_open: false, unavailable_reason: 'subscription_required', redirect_hint: 'subscriptions'` (test-confirmed).

### `toggle` response (plain array, no Resource)

`POST /api/v1/user/favorites/toggle`:
```json
{ "is_favorited": "bool" }
```
`msg` is `apis.favorite_added` or `apis.favorite_removed` depending on direction.

### `destroy` response

`DELETE /api/v1/user/favorites/{id}`: `data` is empty/omitted (`msg` only, `apis.favorite_removed`); 404 if the favorite doesn't belong to the authenticated user.

### `ConsultationCatalogDoctorResource` (NEW)

File: `app/Http/Resources/Api/Consultations/ConsultationCatalogDoctorResource.php`. Used by `GET .../consultations-catalog/doctors`.

```json
{
  "id": "int",
  "name": "string (translated)",
  "image": "string|null (URL)",
  "brief": "string|null (translated)",
  "clinic": {
    "id": "int",
    "name": "string (translated)",
    "image": "string|null",
    "address": "string|null",
    "short_description": "string|null (translated)",
    "category": { "...": "ClinicCategoryResource fields (unchanged in this range)" }
  },
  "has_text_consultation": "bool",
  "has_video_consultation": "bool"
}
```
`clinic` uses the existing `App\Http\Resources\Api\ClinicResource` (unchanged in range) via `whenLoaded('clinic')`.

### `IndividualConsultationTypesResource` (NEW)

File: `app/Http/Resources/Api/Consultations/IndividualConsultationTypesResource.php`. Used by `GET .../doctors/{doctorId}/consultation-types`. Wraps a plain array from `ConsultationsCatalogService::getIndividualConsultationTypes()`.

```json
{
  "doctor_id": "int",
  "clinic_id": "int|null",
  "duration_minutes": "int|null",
  "types": [
    {
      "type": "string (CareBookingTypeEnum value, e.g. 'individual_text_consultation' | 'individual_video_consultation')",
      "type_label": "string (translated)",
      "is_available": "bool",
      "price": "float",
      "duration_minutes": "int|null",
      "minimum_booking_lead_days": "int"
    }
  ]
}
```
`types` always contains exactly 2 entries (text + video) — confirmed by `assertJsonCount(2, 'data.types')`.

### `available-slots` payload (NEW, plain array — no dedicated Resource)

Built by `ConsultationsCatalogService::getAvailableSlots()`, returned directly as `data`:

```json
{
  "doctor_id": "int",
  "clinic_id": "int|null",
  "date": "string (Y-m-d)",
  "type": "string (CareBookingTypeEnum value)",
  "type_label": "string (translated)",
  "minimum_booking_lead_days": "int",
  "duration_minutes": "int|null",
  "slots": [ { "start_time": "string (H:i)", "end_time": "string (H:i)" } ]
}
```

### `ConsultationPackageResource` (NEW)

File: `app/Http/Resources/Api/Consultations/ConsultationPackageResource.php`. Used by `GET .../doctors/{doctorId}/packages` (`ConsultationPackage::active()` scope only).

```json
{
  "id": "int",
  "name": "string (translated)",
  "description": "string|null (translated)",
  "sessions_count": "int",
  "total_price": "float",
  "minimum_days_between_sessions": "int",
  "doctor": { "id": "int", "name": "string (translated)", "image": "string|null", "short_bio": "string|null" }
}
```
`doctor` uses the existing `App\Http\Resources\Api\DoctorBasicResource` (unchanged in range) via `whenLoaded('doctor')`.

### Book / Fulfill-slot response (reuses existing, unchanged resources)

Both `POST .../book` and `POST .../fulfill-slot` return:
```json
{
  "payment": { "/* PaymentTransactionResource, unchanged in range */": "..." },
  "care_booking": { "/* CareBookingResource, unchanged in range, or null */": "..." }
}
```
`care_booking` is `null` on `book` when the payment result is `pending` (test-confirmed: `test_pending_payment_checkout_does_not_create_individual_care_booking`).

`PaymentTransactionResource` (pre-existing, unchanged) fields: `id, payment_ref, idempotency_key, status, status_label, amount, base_amount, currency, exchange_rate, driver, payment_method, requires_slot_selection, fulfillment_status, message, payment_url, created_at`.

`CareBookingResource` (pre-existing, unchanged) fields: `id, clinic_id, doctor_id, booking_type, booking_type_label, appointment_date, start_time, end_time, requires_slot_selection, payment_ref, amount, currency, status, status_label, user_name, user_email, user_phone, notes, completed_at, room_id, clinic, doctor, payment_transaction, invoice, created_at`.

## Breaking changes for the frontend

**No renames or removals in this range.** Every change to an existing response shape is **additive** (a new field) or a **behavior fix** (a field that already existed starts returning real data instead of a hardcoded constant). None of it requires the frontend to change existing field-access code; it only unlocks a field that previously always read `false`/absent.

Exact per-resource change, verified with `git diff 0937817 dfd368c -- <file>`:

| Resource file | Change | Field | Type | Classification |
|---|---|---|---|---|
| `app/Http/Resources/Api/ClinicDetailResource.php` | `'is_favorited' => false, // TODO` → `'is_favorited' => (bool) ($this->is_favorited ?? false)` | `is_favorited` (already existed) | `bool` | **Behavior fix, not a shape change** — field name/position/type unchanged; value now reflects the real favorite state instead of being permanently `false`. Safe. |
| `app/Http/Resources/Api/Trips/TripPackageDetailResource.php` | 1 line added, end of array | `is_favorited` (new) | `bool` | **Additive.** Safe. |
| `app/Http/Resources/BookDetailResource.php` | 1 line added, end of array | `is_favorited` (new) | `bool` | **Additive.** Safe. |
| `app/Http/Resources/CourseDetailResource.php` | 1 line added, end of array | `is_favorited` (new) | `bool` | **Additive.** Safe. |
| `app/Http/Resources/EncyclopediaNewsDetailResource.php` | 1 line added, end of array | `is_favorited` (new) | `bool` | **Additive.** Safe. |
| `app/Http/Resources/HerbalLibraryEntryDetailResource.php` | 1 line added, end of array | `is_favorited` (new) | `bool` | **Additive.** Safe. |
| `app/Http/Resources/PlantFungiEntryDetailResource.php` | 1 line added, inside the fixed (non-`optionalFields`) part of the top-level array, before `array_merge(..., $this->optionalFields())` appends the conditional fields | `is_favorited` (new) | `bool` | **Additive.** Safe. |

All seven added/fixed at the **top level** of their respective `data` object (not nested), sitting alongside existing fields like `id`, `name`/`title`, `description`. All default to `false` for guests (`FavoriteService::appendFavoriteState()` sets `false` on every item when `$user` is null) and for items the current user has not favorited.

**None of the task's other named "possibly modified" resources** — `IndividualConsultationTypesResource`, `ConsultationPackageResource`, `ConsultationCatalogDoctorResource`, `FavoriteResource` — existed before this range (all newly created), so there is no prior shape to diff against; they're simply new.

## Request contracts

### `GET /api/v1/user/favorites`
No FormRequest. Query params:
- `type` (optional) — must be a valid `FavoriteFavoritableTypeEnum` value (`course`, `book`, `encyclopedia_news`, `herbal_library_entry`, `clinic`, `trip_package`, `plant_fungi_entry`); invalid values throw (enum `::from()` is not wrapped in a validator here — passing an unknown `type` will 500, not 422; flag this to the frontend team as something to avoid sending arbitrary values for).
- `per_page` (optional) — `PaginationTrait::resolvePerPage()`: `min(max((int) per_page, 1), 100)`, default `15`.

### `POST /api/v1/user/favorites/toggle`
`App\Http\Requests\Api\Favorites\ToggleFavoriteRequest` (`authorize()` returns `true`):
```php
'type' => ['required', 'string', Rule::in(FavoriteFavoritableTypeEnum::values())],
'id' => ['required', 'integer', 'min:1'],
```
422 with `response_status.validation_errors.id.0 = apis.favoritable_not_available` if the target exists but is inactive/soft-deleted-and-still-favoritable-by-id (i.e. found but not currently active); a different message (`apis.favoritable_not_found`) if the id doesn't exist at all.

### `DELETE /api/v1/user/favorites/{id}`
No body. `{id}` constrained `->whereNumber('id')`. 404 if the favorite id doesn't belong to the authenticated user (`firstOrFail()` scoped by `user_id`).

### `GET /api/v1/user/consultations-catalog/doctors`
No FormRequest — plain `Request`, read directly:
- `search` (optional) — LIKE match against `name->ar` / `name->en`.
- `per_page` (optional) — same rule as above.

### `GET /api/v1/user/consultations-catalog/doctors/{doctorId}/consultation-types`
No validated input. 404 (`NotFoundHttpException`, `apis.favoritable_not_found`) if the doctor doesn't exist or its clinic isn't active.

### `GET /api/v1/user/consultations-catalog/doctors/{doctorId}/available-slots`
`App\Http\Requests\Api\Consultations\ConsultationAvailableSlotsRequest`:
```php
'date' => ['required', 'date_format:Y-m-d'],
'type' => ['required', 'string', Rule::in(CareBookingTypeEnum::individualConsultationTypeValues())],
// 'individual_text_consultation' | 'individual_video_consultation'
```

### `GET /api/v1/user/consultations-catalog/doctors/{doctorId}/packages`
No FormRequest. `per_page` (optional), same rule.

### `POST /api/v1/user/consultations-catalog/doctors/{doctorId}/book`
`App\Http\Requests\Api\Consultations\BookIndividualConsultationRequest` (requires `auth:user`). `prepareForValidation()` auto-fills `idempotency_key` (header `X-Idempotency-Key`, else body, else generated), `currency` (uppercased, default `config('currency.base', 'KWD')`), and `user_name`/`user_email`/`user_phone` from the authenticated user when omitted.
```php
'type' => ['required', 'string', Rule::in(CareBookingTypeEnum::individualConsultationTypeValues())],
'appointment_date' => ['required', 'date_format:Y-m-d'],
'start_time' => ['required', 'date_format:H:i'],
'payment_method_id' => ['required', 'integer', Rule::exists('payment_methods', 'id')->where(status=true, deleted_at=null)],
'currency' => ['required', 'string', Rule::in(config('currency.supported', ['KWD']))],
'idempotency_key' => ['required', 'string', 'max:100'],
'user_name' => ['required', 'string', 'max:255'],
'user_email' => ['required', 'email', 'max:255'],
'user_phone' => ['required', 'string', 'max:30'],
'notes' => ['nullable', 'string', 'max:2000'],
'simulate_result' => ['nullable', 'string', Rule::in(['success', 'failed', 'pending'])],
```
Example request body (from test):
```json
{
  "type": "individual_text_consultation",
  "appointment_date": "2026-07-20",
  "start_time": "09:00",
  "payment_method_id": 1,
  "currency": "KWD",
  "simulate_result": "success"
}
```
`simulate_result` is a test/dev hook — flag to the frontend team that it should not be sent from production client code (whether it's stripped outside test/dev environments wasn't verified in this pass).

### `POST /api/v1/user/consultations-catalog/doctors/{doctorId}/fulfill-slot`
`App\Http\Requests\Api\Clinics\FulfillCareBookingSlotRequest` (pre-existing, reused unchanged):
```php
'payment_ref' => ['required', 'string', 'max:100'],
'appointment_date' => ['required', 'date_format:Y-m-d'],
'start_time' => ['required', 'date_format:H:i'],
```

## Confirmed by tests

`tests/Feature/Api/User/FavoriteControllerTest.php` (new):
- Guest → `GET/POST toggle/DELETE favorites` all 401.
- Empty list for a new user: `data.items = []`.
- Toggle add then toggle again removes: `data.is_favorited` flips `true` → `false`; DB row created then deleted; duplicate toggles never create 2 rows for the same target.
- Toggling an inactive `Course` (`status: false`) → 422, `response_status.validation_errors.id.0` = `apis.favoritable_not_available`.
- Course, Book, and Encyclopedia News can all be favorited; `GET /favorites` then returns `data.items` count 3.
- A favorited `plant_fungi_entry` for a user with no active subscription stays listed but `item.can_open = false`, `item.unavailable_reason = 'subscription_required'`, `item.redirect_hint = 'subscriptions'`.
- A favorited clinic that is later disabled (`status: false`) shows `item.is_available = false`, `item.can_open = false`, `item.unavailable_reason = 'disabled_or_deleted'` in the list.
- `DELETE /favorites/{id}` for a favorite owned by another user → 404; for the owner → 200 and the row is gone from `favorites`.
- `GET /api/v1/user/courses/{id}` for a user who favorited that course → `data.is_favorited = true` (proves the controller wiring, not just the resource field).
- Herbal library entries can be favorited via `toggle`.

`tests/Feature/Api/User/ConsultationsCatalogTest.php` (new):
- `GET .../doctors` → 200, correct pagination total, `items.0.id/clinic.id/has_text_consultation/has_video_consultation`; doctors whose clinic is inactive are excluded.
- `?search=Ahmed` filters by translated name.
- `GET .../doctors/{id}/consultation-types` → `doctor_id`, `duration_minutes` (from `clinic.booking_duration_minutes`), exactly 2 `types` entries with correct `price`/`is_available` per type.
- Inactive-clinic doctor → `consultation-types` 404.
- `GET .../doctors/{id}/available-slots?date=...&type=...` → `doctor_id`, `date`, `type`, `minimum_booking_lead_days`, `duration_minutes`, `slots` array of `{start_time, end_time}` (3 slots from a 09:00–12:00/60-min schedule).
- Unavailable type → `slots: []`.
- `GET .../doctors/{id}/packages` → only `is_active: true` packages, numeric `total_price`, `doctor.id` present.

`tests/Feature/Api/User/IndividualConsultationBookingTest.php` (new):
- Successful text/video booking → 200, `care_booking.booking_type`/`status = confirmed`; `care_bookings` and `invoices` rows created; `room_id` set.
- Guest → `book` 401 (confirms `auth:user`).
- Duplicate upcoming booking with same doctor → 422, `response_status.error = true`.
- Rebooking after a prior booking `completed` → allowed.
- `simulate_result: 'pending'` → 200, `data.payment.status = 'pending'`, `data.care_booking = null`, no `care_bookings` row yet.
- Two users racing the same slot, both resolved to `success` → the second lands `PENDING_SLOT`; `fulfill-slot` with a new `start_time` → 200, `status = confirmed`, `start_time` updated.
- Unavailable consultation type → 422.
- Pre-existing `individual-consultations` portal routes (unchanged) work against bookings created via the new endpoint: `portal.state` transitions `preparing` → `active`, `portal.can_interact` follows.

## Migrations affecting API responses

- `database/migrations/2026_07_15_140000_create_favorites_table.php` — new table `favorites`: `user_id` (FK → `users`), `favoritable_type` (string), `favoritable_id` (unsigned bigint), timestamps; unique on `(user_id, favoritable_type, favoritable_id)`; index on `(user_id, created_at)`. Directly backs `FavoriteResource` and the `is_favorited` field added to the 6 detail resources.
- `database/migrations/2026_07_16_100000_create_doctor_individual_consultation_configs_table.php` — new table `doctor_individual_consultation_configs`: `doctor_id` (unique FK → `doctors`), `text_individual_consultation` (json, nullable), `video_individual_consultation` (json, nullable), timestamps. Surfaces via `ConsultationCatalogDoctorResource.has_text_consultation`/`has_video_consultation` and the consultation-types/available-slots payloads (`is_available`, `price`, `minimum_booking_lead_days`).
- `database/migrations/2026_07_16_110000_create_consultation_packages_table.php` — new table `consultation_packages`: `doctor_id` (FK → `doctors`), `name` (json), `description` (json, nullable), `sessions_count` (uint), `total_price` (decimal 10,2), `minimum_days_between_sessions` (uint, default 0), `is_active` (bool, default true, indexed), timestamps, soft-deletes. Directly backs every field in `ConsultationPackageResource`.
- `database/migrations/2026_07_15_163230_create_activity_log_table.php` — new table for Spatie activity logging. Admin/dashboard only, not exposed on any `/api/...` route in this range.
