# Lusha

Lusha is a B2B contact and company data platform. This package covers contact and company search, enrichment, search-and-enrich, prospecting, lookalikes, buying groups, signals and signal scores, website visits, contact and company tables, webhook subscriptions, audit logs and account usage (65 tools).

Interface: Lusha's official OpenAPI document, https://docs.lusha.com/openapi.json (v3 API at `https://api.lusha.com`). Lusha also runs an official MCP server at https://mcp.lusha.com/ (MCP OAuth); it is not mounted here. Its tool set was not retrieved or compared with the REST operations (the probe confirmed OAuth only), so the REST API is the interface used.

Auth: API key, sent in the `api_key` header. Copy it from the API settings in the Lusha dashboard. Lusha offers no user-created OAuth apps for the REST API.

Icon: the vendor's app icon (PNG from lusha.com), because Simple Icons has no Lusha mark.

Known gaps: enrichment and prospecting calls consume Lusha credits. Every non-GET operation requires approval. That includes the POST search calls (contacts and companies search, lookalikes, signals, conversations search), which are reads but consume credits, so they prompt. `getAccountSecret` returns the webhook signing secret and is also forced to require approval. The account health check calls `GET /v3/account/usage`, which Lusha limits to 5 requests per minute; repeated connects or retries may fail the check until the window resets.
