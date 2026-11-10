# Currents API

Latest news headlines and article search from [Currents API](https://currentsapi.services), plus the lists of available categories, languages and regions.

Interface: the vendor's official Swagger 2.0 document, https://currentsapi.services/json/swagger.json (5 read-only operations on `api.currentsapi.services/v1`).

Auth: API key. Create one at https://currentsapi.services (register, then copy the key from your account page). It is sent as `Authorization: Bearer <key>`. The service has no OAuth.

Known gaps: the Swagger also defines a legacy `?apiKey=` query-string method (ApiKeyQuery); it is intentionally not offered because the Authorization header is the documented method. A newer `/v2` API exists (cursor pagination) but no published v2 spec was found, so only v1 is covered. The free plan has a daily request quota (HTTP 429 once exhausted). The Swagger document covers only the five v1 operations.

Icon: the official `logo-only.svg` from currentsapi.services.
