# Apple App Store

Covers the App Store Connect API: apps, builds, TestFlight, app and version metadata, customer reviews, in-app purchases, subscriptions, pricing, users and roles, provisioning, and sales and analytics reports (1337 tools, 489 of them mutations that ask for approval).

**Interface:** OpenAPI. Apple publishes its official document only as a zip, at https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip, which a live URL source cannot read. `scripts/vendor-openapi.ts apple-app-store` downloads the zip, unpacks `openapi.oas.json` into `openapi.json` (minified, unchanged otherwise), and records the zip URL, its SHA-256 and the retrieval date in `info.x-executor-source`. Rerun it when Apple updates the API.

**Auth:** API key. Create a team key in App Store Connect under Users and Access, Integrations, App Store Connect API (https://appstoreconnect.apple.com/access/integrations/api). Enter the Issuer ID, the Key ID and the contents of the downloaded `.p8` private key (Apple lets you download it once). The app signs a short-lived ES256 JWT (`aud: appstoreconnect-v1`) for every request. Individual keys work for the endpoints their role permits. Apple offers no OAuth.

**Known gaps:** sales, finance and analytics report downloads return gzip data, which arrives as base64. Tokens are not scoped, so the key's role limits what succeeds.
