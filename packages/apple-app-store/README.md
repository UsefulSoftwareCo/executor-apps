# Apple App Store

Covers the App Store Connect API: apps, builds, TestFlight, app and version metadata, customer reviews, in-app purchases, subscriptions, pricing, users and roles, provisioning, and sales and analytics reports (1303 tools, 477 of them mutations that ask for approval).

**Interface:** OpenAPI. Apple publishes its official document only as a zip at https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip, which a live router cannot read. The package therefore reads the community mirror https://raw.githubusercontent.com/EvanBacon/App-Store-Connect-OpenAPI-Spec/main/specs/latest.json, which a GitHub Action keeps in sync with Apple's zip (same content, reformatted JSON). This is not an Apple-hosted URL.

**Auth:** API key. Create a team key in App Store Connect under Users and Access, Integrations, App Store Connect API (https://appstoreconnect.apple.com/access/integrations/api). Enter the Issuer ID, the Key ID and the contents of the downloaded `.p8` private key (Apple lets you download it once). The app signs a short-lived ES256 JWT (`aud: appstoreconnect-v1`) for every request. Individual keys work for the endpoints their role permits. No OAuth: Apple offers none.

**Known gaps:** sales, finance and analytics report downloads return gzip data that arrives as base64. Tokens are not scoped; the key's role limits what succeeds. If Apple changes the zip, the mirror can lag a few days.
