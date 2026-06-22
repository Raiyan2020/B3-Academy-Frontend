# Frontend storage inventory

Storage keys are owned by repository/service modules. Compatibility readers may read legacy keys during migration, but components must not introduce new direct storage access.

| Key | Canonical owner | State |
|---|---|---|
| `b3-pending-intent` | pending-intent repository | canonical |
| `b3-course-enrollments` | enrollment repository | canonical |
| `b3-course-progress` | course-progress repository | canonical |
| `b3-quiz-attempts` | quiz-attempt repository | canonical |
| `b3-course-certificates` | certificate repository | canonical |
| `b3-book-purchases` | book-purchase repository | canonical |
| `b3-book-progress-*` | book-content/progress repository | migration required |
| `b3-payment-records` | payments repository | canonical |
| `b3-payment-intents` | payments repository | canonical |
| `b3-care-consultation-records` | care repository | canonical |
| `b3-care-clinic-booking-records` | care repository | canonical |
| `b3-care-trip-records` | care repository | canonical |
| `b3-subscription-history` | subscription-history repository | canonical |
| `b3-newsletter-subscriptions` | newsletter repository | canonical |
| `b3-community-chat-messages` | community-chat repository | canonical |
| `b3-cooperation-requests` | cooperation repository | canonical |
| `b3-account-favorites` | account repository | canonical |
| `b3-account-notifications` | account repository | canonical |
| `b3-health-assessment-records` | assessment repository | canonical |
| User aggregate purchase/care arrays | auth compatibility adapter | remove after domain migration |

Canonical targets for duplicated data are enrollment records, format-specific book purchases, and canonical care records. Inline monograph, encyclopedia, and community fixtures migrate into their feature repositories.
