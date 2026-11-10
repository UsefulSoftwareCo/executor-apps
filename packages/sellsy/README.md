# Sellsy

Sellsy CRM and invoicing: companies, individuals, contacts, opportunities, estimates, orders, invoices and credit notes, products, taxes, accounting, tasks, calendars, phone calls, custom fields and the rest of the Sellsy API v2.

**Interface:** OpenAPI, Sellsy's official API v2 description at https://docs.sellsy.com/api/v2/dist/sellsy.v2.latest.yaml (the file loaded by https://docs.sellsy.com/api/v2/). Every mutation asks for approval.

**Auth:** both methods use an OAuth 2 client the user creates in Sellsy under Settings > Developer portal > API V2 (https://www.sellsy.fr/developer/api-v2). Sellsy ties the granted scopes to the client, so choose them when creating it.
- `oauth` (authorization code with PKCE): create a Private client (or a Public one approved by Sellsy), add Executor's redirect URI shown on the connect page, and enter its client ID and secret.
- `machine` (client credentials): create a Personal client; the connect page exchanges its client ID and secret directly, with no browser sign-in.

Tokens come from https://login.sellsy.com/oauth2/access-tokens (JSON token requests) and are sent to https://api.sellsy.com/v2.

**Known gaps:** 183 of the 423 operations are generated. Sellsy's description reuses schemas through deep JSON pointers (for example `#/components/schemas/Activity/properties/_embed/properties/author` or `#/paths/...`), which Executor does not resolve, so 240 operations are left out (219 schema references, 21 path references), among them comments, many custom-field and smart-tag writes and e-signature calls. The Sellsy v1 API is not included.
