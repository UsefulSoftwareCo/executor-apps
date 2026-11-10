# Keap

Keap (formerly Infusionsoft) CRM: contacts, companies, opportunities, orders, products, tags, automations, campaigns, emails, files, users, plus REST v1 resources such as REST Hooks, appointments and notes.

**Interface:** OpenAPI. Keap's own live documents behind developer.keap.com: REST v2 (`https://crm.infusionsoft.com/app/v3/api-docs/V2`, 403 tools, the default version) mounted under `v2`, and REST v1 (`https://crm.infusionsoft.com/app/v3/api-docs/V1`, 141 tools) mounted under `v1`. Prefer `v2`; use `v1` for what v2 lacks. Requests go to `https://api.infusionsoft.com/crm`. Mutations require approval.

**Auth:**
- Service account key or personal access token (`apiKey`): create one in the Keap developer portal (keys.developer.keap.com) or in Keap under Settings, API. Sent in the `X-Keap-API-Key` header.
- OAuth 2.0 (`oauth`): register an app at keys.developer.keap.com and enter its client ID and secret on the connect page. Add Executor's redirect URI to the app's allowed callbacks. Authorization at `accounts.infusionsoft.com`, tokens from `api.infusionsoft.com/token`, single scope `full`.

**Known gaps:** The XML-RPC API is not covered. The v1 and v2 documents overlap, so some operations appear in both.
