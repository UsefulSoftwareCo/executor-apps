# AdRoll

Covers the AdRoll (NextRoll) CRUD API: advertisables, organizations, campaigns, ad groups, ads, segments, pixels and rules, product feeds, consent banners, cross-device opt-in, users, marketplaces, invoices and the ad, campaign and advertisable performance reports. 91 tools, grouped by resource (`campaign.create`, `report.campaign`, ...).

**Interface:** hand-written tools generated from a table that mirrors the official CRUD API reference, https://apidocs.nextroll.com/crud-api/reference.html, against `https://services.adroll.com`. AdRoll publishes no downloadable OpenAPI document (the developer portal at developers.adroll.com only serves it through its interactive viewer), so the table is the reference page transcribed. Every non-read operation requires approval. Parameter docs are in each tool description. Array parameters are sent as repeated keys; POST and PUT bodies are form-encoded, as the API documents.

## Auth

- **Personal access token** (`token`): create a token in the AdRoll dashboard settings page and a client ID by registering an app at https://developers.nextroll.com (My Apps, Add New App). The token goes in `Authorization: Token ...` and the client ID in the `apikey` query parameter.
- **OAuth 2.0** (`oauth`): register an app at https://developers.nextroll.com, then enter its client ID and secret on the connect page. Endpoints are `https://services.adroll.com/auth/authorize` and `/auth/token`, with client credentials in the form body. The only scope AdRoll offers is `all`. Set the app's redirect URI to Executor's OAuth callback URL, which the connect page shows. Access tokens last 24 hours; refresh tokens are single-use and rotate.

The current get-started guide publishes a default quota of 100 requests per service per day; the API key migration guide describes a Basic tier of 10,000 calls per day. Check your app's tier in the developer portal.

## Official MCP server

AdRoll publishes an official beta remote MCP server at https://services.adroll.com/mcp (OAuth 2.1 with dynamic registration; `scripts/mcp-probe.ts` returns 401 with verdict oauth). Its tool list cannot be enumerated without an authenticated AdRoll account, so it was not evaluated. This package uses the documented, versioned CRUD API with 91 known tools instead of a beta server whose tool count and scope are unknown. Revisit once the MCP leaves beta.

## Known gaps

- Operations that upload files are left out: `ad/create` (image upload) and `advertisable_logo/create`; `rule/create` omits its CSV upload.
- The separate GraphQL Reporting, Audience, Automated Campaigns, Universal Campaigns, User Lists, Geotargeting and S2S APIs are not covered.
- Which parameters are required is taken from the reference page where it names an identifier; other fields are optional here and AdRoll returns a 400 if it needs them.
- Not verified against a live account.
