# Wave Accounting

Wave's free accounting and invoicing: businesses, customers, products, invoices, chart of accounts, sales taxes and money transactions.

Interface: Wave's official GraphQL API at `https://gql.waveapps.com/graphql/public` (schema introspection is public and was confirmed to work without a token; tools are generated from it, but queries with a real Bearer token have not been run). Every mutation requires approval.

Auth:
- Full access token (`apiKey`): create an application at https://developer.waveapps.com/hc/en-us/articles/360019762711 (Manage Applications), then generate a full access token for it. Sent as a Bearer token.
- OAuth 2.0 (`oauth`): in the same Manage Applications page, create an application and set its redirect URI to the redirect URI shown on Executor's connect page. Authorization `https://api.waveapps.com/oauth2/authorize/`, token `https://api.waveapps.com/oauth2/token/`. The authorization URL keeps the trailing slash: `https://api.waveapps.com/oauth2/authorize` answers 301 to the slash form, which then redirects to Wave's login, so the slash form is the canonical one. The token endpoint authenticates with `client_secret_post` (client_id and client_secret in the POST body, as Wave's OAuth guide shows); this and the absence of extra authorization params could not be re-checked because developer.waveapps.com returns 403 to automated fetches. The scope names follow Wave's `resource:read` / `resource:write` pattern but could NOT be confirmed against Wave's docs or the public schema (the schema does not mention scopes); `transaction:read`, `sales_tax:*` and `estimate:*` are not requested because their existence is unconfirmed. If Wave rejects a scope, edit the list in `index.ts`.

Icon: Wave's mark from the official website logo (`wave-logo-icon-white.svg`), recolored to the brand blue #0041FF.

Known gaps: Wave's API cannot create or edit some resources (e.g. bills), and money transaction creation is limited to what the public schema exposes.
