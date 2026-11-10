# AddressZen

Address autocomplete and retrieval, address verification (USPS CASS for the US, other countries by licensed dataset), places, email and phone number validation, and management of the connected API key (availability, details, usage, lookup logs, licensees and configs).

**Interface:** OpenAPI. The tools are compiled from AddressZen's official OpenAPI 3.0.3 document (v4.1.1) at https://openapi.addresszen.com/openapi.json, server `https://api.addresszen.com/v1`, documented at https://docs.addresszen.com/docs/api. 25 operations, 0 skipped. 10 are mutations (POST/PUT/DELETE: address verify, key update, licensee and config create/update/delete, licensee key regenerate, sign-up) and always require approval. Address verify writes nothing, but it bills per match, so it is treated as a mutation too.

**Auth:** two methods, both sent as `Authorization: Bearer ...` to `api.addresszen.com` (the only host credentials reach).
- *API key*: an `ak_...` key from the AddressZen dashboard (https://addresszen.com). Enables lookups, verification, places, email and phone validation, and the public key availability check.
- *API key and management key*: the same `ak_...` key plus the management key (`uk_...`, formerly the user token) from the dashboard. Additionally enables the `/keys/{key}` management tools.

AddressZen has no OAuth. Bearer is what the vendor's OpenAPI document and error-code docs prescribe. The older `Authorization: api_key="ak_..."` form and the `api_key` / `user_token` query parameters still work (the spec marks the older header deprecated); the general docs page still shows the older form, so the two disagree and Bearer is used as the current one.

**Notes:** autocomplete (`GET /autocomplete/addresses`, parameter `query`) is not billed, but keys that autocomplete without resolving suggestions are rate-limited and then suspended; resolve the chosen suggestion with the retrieve or place tools. Billed calls: address retrieve, place resolve, matched verify, phone and most email validations. Phone and email validation need a key licensed for those datasets. The health check calls the public `GET /keys/{key}`, which carries the API key in the URL path by the vendor's design, so it can reach access logs. Licensee keys (`sl_...`) are not a separate login method.
