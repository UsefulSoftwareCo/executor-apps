# VerifiedEmail

Verifies email addresses (up to 10 per synchronous request) and manages VerifiedEmail lists, downloads, widgets, credit entitlements and API keys.

**Interface:** OpenAPI 3.0, the vendor's official document behind https://developer.verified.email/. The site publishes no standalone spec file (Swagger UI embeds it in `swagger-ui-init.js`), so `openapi.ts` carries a copy as an inline `document`, with one fix: its parameter schemas referenced `#/components/parameters/X` instead of `#/components/schemas/X`, which no compiler can resolve. API origin: `https://api.verified.email`.

**Auth:** API key (bearer token). Create one at https://app.verified.email/apikeys (guide: https://verified.email/help/api/api-keys). VerifiedEmail does not offer OAuth for the API.

**Gaps:** none known. If the vendor changes its API, refresh the embedded document. Mutations (save/delete/approve) require approval.
