# Brex

Brex users, departments, locations, titles, cost centers, cards, legal entities, card transactions and statements, cash accounts, vendors, transfers, budgets, expenses, custom fields, accounting records, travel and webhooks (110 tools).

## Interface

OpenAPI. Brex publishes one official document per API on its developer portal, all served from `https://api.brex.com`. Each is mounted as its own router (`team`, `transactions`, `payments`, `budgets`, `expenses`, `fields`, `accounting`, `travel`, `webhooks`):
`https://developer.brex.com/_bundle/openapi/<name>_api.yaml` (for example `team_api.yaml`). Brex also runs an OAuth MCP server at `https://api.brex.com/mcp` (beta). It returns 401 without credentials, so its tool set was not checked and it is not used. The `_bundle/openapi` path is a developer-portal build path rather than a documented API, so the document URLs could move.

## Auth

- **User token** (`token`): the company must first accept the developer API agreement; then create one in the Brex dashboard under Developer, Settings, Create Token, with the scopes you need. It is sent as a bearer token.
- **OAuth** (`oauth`): Brex OAuth is only available to Brex developer partners. There is no self-service app creation; Brex support issues the client ID and secret, and scopes are assigned by Brex (users may accept 0 to all of the requested scopes). The redirect URI shown on the connect page must be registered with Brex support, since Brex only accepts redirect URIs provided when the credentials were set up. Enter the Brex-issued client ID and secret on the connect page. Endpoints are discovered from `https://accounts-api.brex.com/oauth2/default`; the client ID and secret are sent in the token request body (`client_secret_post`; PKCE S256). The requested scopes cover every operation in the included APIs, including both the write scopes and the explicit read scopes (Brex's docs do not state that write scopes imply read), plus `travel.trips`, `companies.readonly`, the cash transaction and statement scopes, and `cards.pan` (needed only by the full card number operations `GET /v2/cards/{id}/pan` and `POST /v2/cards/{id}/secure_email`). Tools are not filtered by scope, so an operation whose scope Brex did not grant fails with 403.

Every mutation requires approval.

## Known gaps

- The partner onboarding API (referrals, client credentials) is not included.
- Sandbox (`api-staging.brex.com`) is not supported; the tools target production.
