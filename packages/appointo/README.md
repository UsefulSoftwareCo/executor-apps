# Appointo

Appointment booking for Shopify stores. Covers products, appointments, calendar availability, bookings (list, create, reschedule, cancel, update buffers, list cancelled) and subscription contracts: 11 tools.

**Interface:** hand-written tools over Appointo's REST API at `https://app.appointo.me/api`, documented at <https://api-docs.appointo.me/>. Appointo publishes no OpenAPI document, so each operation is written from the official reference pages. Every mutation requires approval.

**Auth:** API token (`APPOINTO-TOKEN` header). Create it in the Appointo app under Plans & Settings, API access. API access needs a paid Appointo plan. Appointo offers no OAuth.

**Known gaps:**
- The "Upsert Appointment Config" example payload (`PUT /appointments/:id`) has top-level keys `config`, `availabilities` and `override`; their inner shapes are not specified, so they are passed through as free-form JSON.
- `impersonated_tms` is documented only as `[integer]` (example `[123, 234]`); the query-string encoding is not stated. It is sent as a JSON array string (`impersonated_tms=[123,234]`), which is an assumption.
- Appointo limits create, reschedule, cancel and update to 100 requests per day.
- Responses are returned as untyped JSON.
