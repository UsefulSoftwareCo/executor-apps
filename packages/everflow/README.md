# Everflow

Everflow partner marketing platform through its Network API: offers, partners (affiliates) and their users and tiers, advertisers, creatives, tracking domains and links, custom caps, payouts and scrub rates, conversions, clicks, impressions, aggregated and exported reporting, traffic controls and health, billing, webhooks and metadata lookups.

**Interface:** OpenAPI, from Everflow's official specifications at https://developers.everflow.io/openapi/<name>.yaml (documented at https://developers.everflow.io/ai-automation/openapi-specs). Everflow publishes one OpenAPI 3.0 file per resource; this package mounts the 71 Network API files (plus the shared `/meta` lookups) each under its own key in one router, 310 tools (192 mutations), none skipped. Mutations ask for approval.

**Auth:** API key. Enter your API subdomain (`api`, or `api-eu` for EU-hosted accounts) and a Network API key; the key is sent as `X-Eflow-Api-Key` to `https://<subdomain>.eflow.team/v1`. Create the key in the Everflow platform under Control Center > Security (a network admin or employee can; keys are shown once and carry their own permission scopes, so create a narrowly scoped one). Everflow has no OAuth.

**Known gaps:** The Affiliate (`/affiliates`), Advertiser (`/advertisers`) and Marketplace (`/partners`) portal APIs use different key types and are not mounted; Everflow's own Network MCP server (`mcp.eflow.team`, 16 reporting tools) is also not mounted because the Network API already covers reporting. `GET /networks` (the health check) is defined in network-info.yaml and is mounted. smart-links-extras is omitted because it has no paths.
