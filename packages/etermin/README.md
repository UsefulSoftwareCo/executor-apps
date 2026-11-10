# eTermin

Covers the eTermin online appointment scheduling REST API: appointments, contacts, calendars, services, working and non-working times, ratings, booking page logs and message logs (70 operations, 46 of them mutations, all requiring approval).

Interface: OpenAPI, the vendor's own document published on SwaggerHub at https://api.swaggerhub.com/apis/etermin.net/eTermin-API/1.0.0 (linked from https://www.etermin.net/online-terminplaner-api). The document lists a SwaggerHub mock server and declares no security scheme, so the package sets the real origin (`https://www.etermin.net`) and the `publickey` header itself.

Auth: API keys. In eTermin, open Configuration > Integration - API > API to find the public key and private key. Executor asks for both. Every request carries `publickey`, a fresh random `salt`, and `signature`, the base64 HMAC-SHA256 of the salt keyed with the private key; the package computes these per request. The private key is therefore stored as a `raw` field that the app can read. eTermin offers no OAuth.

Known gaps: the SwaggerHub document is the only machine-readable description, and it may lag the live API. Webhooks (appointment created/modified/deleted pushes) are not covered.
