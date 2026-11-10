# ActiveCampaign

Contacts (including list, tag and automation membership and custom field values), accounts, deals with pipelines, stages, notes and tasks, mailing lists, tags, custom fields, campaigns and messages, automations, forms, webhooks, users and ecommerce (Deep Data) records in ActiveCampaign, plus a `request` escape hatch for any other v3 endpoint.

## Interface

Hand-written tools over the official REST API v3 (`https://<account>.api-us1.com/api/3`, docs at https://developers.activecampaign.com/reference/overview). ActiveCampaign publishes no OpenAPI document (its docs are ReadMe pages only), and the official remote MCP server exposes only about 50 tools, so the REST API is wrapped directly: about 114 tools. Create and update tools take the request body wrapped in the resource name, as in the API reference; list tools take `limit`, `offset` and a `query` record for `filters[...]` and `orders[...]` keys. The abandoned-cart view is `ecommerce.orders` with `filters[state]=2`. Every create, update and delete tool requires approval.

## Auth

API key. In ActiveCampaign open Settings > Developer and copy both values:

- **API URL host**: the host of the URL shown there, for example `myaccount.api-us1.com` (`*.activehosted.com` hosts are also accepted).
- **API key**: sent as the `Api-Token` header. It acts as the user who owns it.

The public API v3 documents only per-user API keys sent as `Api-Token`; no OAuth flow is documented, so no OAuth method is declared.

Only `*.api-us1.com` and `*.activehosted.com` hosts are accepted. ActiveCampaign says the host in the Developer tab is authoritative and `api-us1.com` is not guaranteed for every account, so accounts whose Developer-tab URL uses another domain are unsupported until a real sample host is confirmed.

## Known gaps

- Endpoints marked deprecated by ActiveCampaign, the Partners API, the SMS Broadcast and WhatsApp APIs, and the Segments API are not wrapped; use `request` for them where the account supports them.
- The GraphQL API (ecommerce only, served at `/ecom/graphql` on the account host) and the remote MCP server (about 50 tools) are not used.
- Rate limit is 5 requests per second per account; HTTP 429 responses are retried up to 3 times, honoring `Retry-After` (capped at 10 seconds), then surface as errors.
- Vendor icon: the official ActiveCampaign glyph from the brand page (https://www.activecampaign.com/brand).
