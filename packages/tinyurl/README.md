# TinyURL

Shorten URLs and manage TinyURL short links: create, look up, update, change, archive and delete links, list them, bulk create, and read click analytics.

**Interface:** OpenAPI. TinyURL publishes its official OpenAPI 3.0 document (v2.4.2) at <https://tinyurl.com/openapi/v2.json>, server `https://api.tinyurl.com`. Tools are generated from it; every non-GET operation requires approval.

**Auth:** API token, sent as `Authorization: Bearer <token>` (the spec's `bearerAuth` scheme). The spec lists `tokenAuth` (api_token query) as a second required scheme on every operation; `openapi.ts` patches each operation to `bearerAuth` only so the token stays out of URLs. Create it at <https://tinyurl.com/app/dev> (Settings, API tokens) with the permissions for the tools you want. TinyURL has no OAuth for third-party apps. The health check calls `GET /urls/available/count`.

**Known gaps:** `tags`, `expires_at`, bulk and analytics need a paid TinyURL plan.
