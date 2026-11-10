# MailBluster

Manage MailBluster email marketing data: leads (create, get, update, delete), custom lead fields, products and ecommerce orders (list, get, create, update, delete). 18 tools; every mutation requires approval.

## Interface

Hand-written tools over MailBluster's REST Developer API at `https://api.mailbluster.com/api`, documented at https://app.mailbluster.com/api-doc. MailBluster publishes no OpenAPI document and no MCP server. The docs site is a single-page app, so the endpoint shapes were cross-checked against the Ruby and n8n community clients (unofficial, facts only). Leads are addressed by the MD5 hash of the lowercased email; the lead tools accept either an email (hashed for you) or a hash.

## Auth

API key. In MailBluster open the brand, then Settings > API Keys > Create new, and paste the key. It is sent as the raw `Authorization` header value (no `Bearer` prefix). Keys are scoped to one brand; connect one account per brand. MailBluster documents no OAuth.

## Known gaps

- The API has no campaign, list/segment or email-sending endpoints, so none are exposed.
- Rate limits are 10 requests per second and 100 per minute.
- Request body shapes for orders and leads follow community clients; the official docs could not be fetched as text.
