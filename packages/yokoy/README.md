# Yokoy

Covers the Yokoy spend management API for one organization: expenses and receipts, invoices, legal entities, card accounts and daily statements, categories, cost centers, users, FX rate sources, tax rates and the rest of the public API, 109 tools in all (54 mutations, each requiring approval).

Interface: OpenAPI 3.0, Yokoy's official API document at https://api.yokoy.ai/v1/swagger.json (the document behind https://developer.yokoy.ai/api-reference/). Its servers are `https://api[.test].yokoy.ai/v1/organizations/{organizationId}`, so each account's own environment and organization ID are used as the base URL, and credentials are only sent to that API origin.

Auth: one method, OAuth 2.0 client credentials (Yokoy uses no scopes). In Yokoy, create an API client and copy its Client ID and Client Secret, plus your organization ID. The connect form asks for the environment (`yokoy.ai` for production or `test.yokoy.ai` for the test environment), the organization ID, the client ID and the client secret. Executor exchanges them for a bearer token at `https://accounts.<environment>/oauth2/token` (HTTP Basic client authentication, form body `grant_type=client_credentials`) and renews it as it expires. This is done in code rather than with the framework's `oauth2` method because the token endpoint and API base depend on the environment and organization. Credentials are limited by `hosts` to `accounts` and `api` on `yokoy.ai` and `test.yokoy.ai`. The account check calls `GET /legal-entities`.

Known gaps: only the OAuth client-credentials method exists; Yokoy offers no user-redirect OAuth or API keys. The `x-yk-auth-method: yokoy` proxy header is not sent, as Yokoy's own documentation only asks for the bearer token.
