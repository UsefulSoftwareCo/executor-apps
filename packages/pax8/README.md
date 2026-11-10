# Pax8

Pax8 cloud marketplace. Partner accounts get companies, contacts, products and pricing, orders, subscriptions, invoices, finance reports and usage summaries (`partner`), quotes with line items, sections, access lists and attachments (`quoting`), and webhook management (`webhooks`): 78 tools. Vendor accounts get the provisioning (21) and usage (3) APIs.

Interface: the official OpenAPI documents at https://devx.pax8.com/openapi/ (`partner-endpoints.json`, `quoting-endpoints.json`, `webhooks-api.json`, `vendor-provisioning-endpoints.json`, `vendor-usage-endpoints.json`), mounted from one provider. Every mutation asks for approval.

Auth: Pax8 uses OAuth 2 client credentials, but its token request needs a JSON body with an `audience`, which the framework's `oauth2` cannot send, so the package mints and caches the token itself (`POST https://api.pax8.com/v1/token`, tokens last a day).

- `partner`: client ID and secret of a partner API key, requested in the Pax8 app. Audience `https://api.pax8.com`.
- `vendor`: client ID and secret issued to marketplace vendors by their Pax8 contact. Audiences `api://provisioning` and `api://usage`, chosen per request.

Pax8 documents a delegated OAuth flow for integrators, but credentials for it are issued by Pax8 (integrations@pax8.com), so it is not offered. No redirect URI is needed.

Gaps: the authentication and `api://p8p.client` audience are not exposed; the vendor provisioning health check only confirms a token can be minted.
