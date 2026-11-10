# Humanitix

Covers the Humanitix public API: events, orders, tickets, check-in counts, check-in and check-out of tickets, and tags.

**Interface:** OpenAPI, Humanitix's own document at https://api.humanitix.com/v1/documentation/json (all operations on `api.humanitix.com`). Mutations (check-in, check-out) require approval.

**Auth:** API key. Create one in the Humanitix console under account > advanced > public API key (https://console.humanitix.com/console/account/advanced/api-key; the key is sent as the `x-api-key` header). The API is one key per account; there is no OAuth.

**Icon:** Humanitix's official app icon (apple-touch-icon from humanitix.com, 180px); Simple Icons has no Humanitix mark.

**Gaps:**
- `/v1/global/events` and `/v1/global/event-dates` need special permission activated by Humanitix, per the spec; they fail for accounts without it.
- `check-in-count` is marked BETA in the spec.
- Humanitix's help center describes the public API as read-only and does not mention check-in/check-out, while the official spec (v1.23.0) defines POST check-in and check-out. Write availability may be restricted for some accounts. Tools follow the official spec.

The health check lists one tag.
