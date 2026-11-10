# Neutrino

Neutrino API's general-purpose utility endpoints: IP info, IP blocklist and host reputation, email, phone and BIN validation, geocoding, bad-word filtering, URL and HTML processing, QR codes and image operations (28 tools, 10 of them mutations that require approval).

**Interface:** OpenAPI 3.0 from Neutrino's official document, https://www.neutrinoapi.com/api/openapi.json (also published as openapi.yaml and swagger.json at the same path). Requests go to the primary endpoint `https://neutrinoapi.net`; the spec lists regional and backup servers, which are not used.

**Auth:** API key only (Neutrino has no OAuth). Enter your User ID and an API key; both are sent as the `user-id` and `api-key` headers. Create them at https://www.neutrinoapi.com/account/ (Security and Keys).

**Known gaps:** Neutrino's official OpenAPI document has no account, balance or usage path, so the connection health check cannot use a free account endpoint. It is an accepted exception: it performs one read-only `ip-info` lookup, which counts as one API request against the plan's quota (Neutrino prices and limits plans per request, https://www.neutrinoapi.com/plans/; its docs do not state a per-endpoint credit cost). Regional/geofence endpoints (eu, usa, aus) are not selectable.
