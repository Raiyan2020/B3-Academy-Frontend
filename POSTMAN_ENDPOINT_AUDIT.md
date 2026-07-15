# B3 Academy Postman endpoint audit

Source: `/Users/abdullah/Downloads/B3 Academy.postman.json`  
Audited: 2026-07-09

## Scope and result

The collection contains **110 requests** and **108 unique method/path pairs**. The duplicated pairs are:

- `POST /user/resend-code` (registration and forgot-password flows)
- `POST /user/verify-code` (registration and forgot-password flows)

Every unique collection route now has a frontend API adapter. Routes are normalized by
`src/lib/api/base-fetch.ts` to `/api/v1/general/*` and `/api/v1/user/*`.

“Used” in this audit means the frontend has an API adapter matching the collection's method,
path, parameters, and known response shape. Some adapters are intentionally not invoked until a
corresponding screen interaction exists; those are listed below.

## Incorrect or unused endpoints corrected

| Collection endpoint | Previous frontend state | Correction |
| --- | --- | --- |
| `POST /user/verify-code` (`type=forgot_password`) | Called nonexistent `/user/forgot-password/verify-code` and omitted `type`. | Now calls `/user/verify-code` with `type: "forgot_password"`. |
| `POST /user/register` | Sent `country_code` with a leading `+`. | Sends the numeric dialing code format shown by the collection. |
| `POST /general/change-lang` | Not used. | Language changes to Arabic or English now sync `device_id` and `lang`; local switching still works if the API is unavailable. |
| `GET /user/books` | Sent `search` instead of `filters[search]`. | Uses the collection's nested filter key. |
| `GET /user/encyclopedia/news` | Sent `search` instead of `filters[search]`. | Uses the collection's nested filter key. |
| `GET /user/encyclopedia/herbal` | Sent `search` and ignored backend taxonomy filters. | Uses `filters[search]`, `filters[family_id]`, `filters[species_id]`, `filters[genus_id]`, and `filters[origin_id]`. |
| `GET /user/encyclopedia/herbal/families` | Unused; UI used mock options. | Filter UI now loads backend families. |
| `GET /user/encyclopedia/herbal/species` | Unused; UI used a mock “type” filter. | Filter UI now loads backend species. |
| `GET /user/encyclopedia/herbal/genera` | Unused; UI used a mock “sex” filter. | Filter UI now loads backend genera. |
| `GET /user/encyclopedia/herbal/origins` | Unused; UI used mock options. | Filter UI now loads backend origins. |
| `POST /user/subscriptions/checkout` | Sent checkout fields in a JSON body. | Sends the fields as query parameters, matching the collection, while retaining the idempotency header. |
| `GET /user/health-assessments/form` | Health form was entirely local and its conditions had no backend IDs. | Authenticated users now load backend sections and condition IDs. |
| `POST /user/health-assessments` | Saved only to local storage. | Authenticated API users now submit every condition as `not_present`, `present`, or `chronic`; the local record remains as an offline/UI fallback. |
| `GET /user/health-assessments` | No API adapter. | Added a null-safe list adapter. |
| `GET /user/health-assessments/:id` | No API adapter. | Added a typed detail adapter matching the collection response. |
| `GET /user/notifications/:id` | No API adapter. | Added a typed detail adapter. |
| `GET /user/encyclopedia/news-types` | No API adapter. | Added a typed taxonomy adapter. No news-type selector exists in the current screen yet. |

## Collection endpoints that are service-only by design

These routes are correctly represented, but the current UI does not need a separate call yet:

| Endpoint | Reason |
| --- | --- |
| `GET /user/notifications/:id` | Notification list payload already contains the title, body, and destination used by the screen. |
| `GET /user/encyclopedia` | The dedicated screen uses the independently pageable news and herbal list endpoints; the combined index adapter is available for compact consumers. |

The news-type selector, address CRUD/default actions, notification bulk/single actions, physical-book
shipping addresses, and health-assessment list/detail screens are now connected to their backend
routes. Local data is retained only as an offline/demo fallback when no backend token or records are
available.

## Frontend calls not documented by this collection

These calls may exist in a newer backend, but they cannot be validated from the supplied Postman
file and should be confirmed before relying on them:

| Frontend call | Current usage |
| --- | --- |
| `POST /user/articles/:id/toggle-like` | Article like action |
| `POST /user/theories/:id/toggle-like` | Theory like action |
| `POST /user/research/:id/toggle-like` | Research like action |
| `POST /user/articles/:id/comments` | Article comment creation |
| `POST /user/theories/:id/comments` | Theory comment creation |
| `POST /user/research/:id/comments` | Research comment creation |
| `GET /user/my-books/:order_id/invoice` | Book invoice link |
| `GET /user/books/:id/stream-ebook` | Ebook reader |

The collection documents comment **listing** only for articles, theories, and research. It does
not document comment creation or likes. It also documents course invoices, but not book invoices
or ebook streaming.

## Collection issue

The contact-message request is stored as `v1/general/contact-messages` while all other requests
use `{{baseUrl}}/...`. The frontend uses the consistent normalized route:
`POST /api/v1/general/contact-messages`.
