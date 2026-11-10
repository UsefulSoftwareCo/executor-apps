# Ideal Postcodes

UK and international address search: postcode lookup, address autocomplete and resolution, UDPRN/UMPRN lookup, address extraction and cleansing, places, email and phone number validation, and management of the connected API key (details, usage, lookup logs, licensees and configs).

**Interface:** OpenAPI. The tools are compiled from Ideal Postcodes's official OpenAPI 3.0.3 document (v5.1.1) at https://openapi.ideal-postcodes.co.uk/openapi.json, server `https://api.ideal-postcodes.co.uk/v1`, documented at https://docs.ideal-postcodes.co.uk. 22 paths, 29 operations compiled, 0 skipped; the two sign-up operations (`POST /sign_up`, `GET /sign_up/{cli_token}`) are deliberately not exposed, so 27 tools are available. Sign-up creates an account and returns its API key once, which is a human onboarding flow that should not put a key into an agent's context. Mutations (POST/PUT/DELETE: address cleanse, key update, licensee and config create/update/delete, licensee key regeneration) always require approval. Address cleanse writes nothing but bills per match, so it asks too.

**Auth:** two methods, both sent as `Authorization: Bearer ...` to `api.ideal-postcodes.co.uk` (the only host credentials reach).
- *API key*: an `ak_...` key from the Ideal Postcodes dashboard (https://ideal-postcodes.co.uk). Enables lookups, autocomplete, cleansing, places, email and phone validation and the public key availability check.
- *API key and management key*: the same `ak_...` key plus the management key (`uk_...`, formerly the user token) from the dashboard. Additionally enables the `/keys/{key}` management tools.

Ideal Postcodes has no OAuth.

**Notes:** autocomplete is not billed, but resolving an address is; resolve the chosen suggestion with the resolve tools rather than abandoning suggestions. The health check calls the public `GET /keys/{key}` (and, for the management-key method, `GET /keys/{key}/details` with the `uk_` bearer so a wrong management key is caught at connect time), which carries the API key in the URL path by the vendor's design, so it can reach access logs. Licensee keys (`sl_...`) are not a separate login method. The icon is the house mark from the vendor's favicon (not in Simple Icons).
