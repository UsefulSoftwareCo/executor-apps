# Dentally

Dental practice management through the Dentally API: patients, appointments and availability, practitioners and rota diaries, sites and rooms, treatments, treatment plans and items, invoices, payments and payment plans, NHS claims, PRSI eligibilities, waiting lists, custom fields and webhooks.

Interface: hand-written tools over Dentally's REST API (https://developer.dentally.co). Dentally publishes no OpenAPI document, so the roughly 100 documented operations are listed in `index.ts`. Every write tool requires approval. Write tools take `body` with the object's attributes and wrap it in the key Dentally requires (`patient`, `appointment`, `payment`, ...).

Auth:

- API token (`apiKey`): in Dentally, Settings > Developer Settings > Generate new token, scoped to the data you need. Enter the token and the environment host: `api.dentally.co` (default; UK, Ireland, Australia), `api.sandbox.dentally.co`, `api.apac.dentally.com` or `api.ca.dentally.com`.
- OAuth 2.0 (`oauth`): requires an OAuth application registered with Dentally (see https://developer.dentally.co). Authorization and token URLs are per region and Executor declares them statically, so OAuth is configured for `https://api.dentally.co`; use an API token for sandbox, APAC and Canada. Use the redirect URI shown on the connect page when registering the app. Scopes requested: `user:read`, `user:update`, `patient`, `appointment`, `financials`, `practice`, `treatments`.

Known gaps: OAuth is limited to the main production host. The API requires a User-Agent header, which the package sets. Create/update bodies are passed through as documented without per-field schemas; the appointment availability endpoint is limited to 200 requests per hour.
