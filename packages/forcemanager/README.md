# ForceManager

Sage Sales Management (formerly ForceManager) CRM: accounts, contacts, opportunities, activities, calendar, emails, documents, sales orders, products, rates, users, roles, value lists, extra fields, views, webhooks and more. 272 tools, 134 of them writes that always ask for approval.

## Interface

OpenAPI 3.0 from the vendor's own developer portal: https://developer.forcemanager.com/openapi.json (docs at https://developer.forcemanager.com/). Tools go to production, `https://api.forcemanager.com/api/v4`. The document also lists a sandbox server (`sandbox-api.forcemanager.com`), which is not used.

## Auth

API keys only; the API has no OAuth. The API needs a **Public API key** and a **Private API key** (see https://developer.forcemanager.com/); ask your ForceManager administrator for them, as the vendor docs do not say where in the app they are shown. The package posts them to `/login` and sends the returned session token as `X-Session-Key`, caching it for 20 minutes (a conservative choice; the docs state no session lifetime) and signing in again after a 401. The health check performs this login because every endpoint requires a session key and the API has no read-only current-user endpoint. The same keys do not work on a sandbox implementation.

## Known gaps

- Production only; sandbox keys will not sign in.
- The vendor's document names some routes with literal `VALUE` segments (for example `/list/VALUE` for value lists, `/extrafields/VALUE`); they are generated as documented.
- Icon: the Sage wordmark, because the product is now branded Sage Sales Management and the vendor's own docs use it. No separate ForceManager mark is published.
