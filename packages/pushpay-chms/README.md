# Pushpay ChMS

Pushpay ChMS (formerly Church Community Builder) v2 API: individuals, families, groups, events, scheduling, forms, processes, queues, needs, notes, campuses, searches and church settings (394 tools, 209 of them mutations that ask for approval).

**Interface:** Pushpay's official OpenAPI document, `https://docs.pushpay.io/chms-v2/openapi/chms-api-specs.json`. All calls go to `https://api.ccbchurch.com` and send `Accept: application/vnd.ccbchurch.v2+json`.

**Auth:** OAuth 2.0 authorization code only (the API has no API keys). Pushpay issues OAuth apps to value-added partners: apply at https://vendor.ccbchurch.com/goto/forms/15/responses/new (see https://docs.pushpay.io/chms-v2/docs/getting-started). Enter the app's client ID and secret on the connect page, and register Executor's redirect URI exactly as shown there. A Master Administrator (or a user who can edit system-wide settings) of the church must approve the app. No scopes are requested, so the token gets every scope the app was granted. Refresh tokens rotate and are single use.

**Known gaps:** Production endpoints only (the sandbox uses `beta-oauth.ccbchurch.com` / `api-beta.ccbchurch.com`). The vendor also documents an MCP server (https://docs.pushpay.io/chms-v2/docs/mcp) that was not mounted. The authorize URL's optional `subdomain` parameter is not set; the admin picks the church on the sign-in page. Not verified against a live account.

**OAuth notes:** Executor's `oauth2()` has no option to set headers on token requests, so the documented `Accept: application/vnd.ccbchurch.v2+json` header is sent on API calls and the health check but not on the token exchange or refresh; this was not tested live. The token request is form-encoded (the default `tokenRequestFormat`), as the vendor docs specify, with `client_id` and `client_secret` in the body (`client_secret_post`). Executor adds PKCE parameters (`code_challenge`) to the sign-in request itself and the package cannot turn them off; the vendor does not document PKCE, and a conforming server ignores unknown parameters. The health check calls `GET /me` and does not read `id`, because the spec marks no field of that response as required.
