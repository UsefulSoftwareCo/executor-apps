# Vantage

Cloud cost management through the Vantage REST API: cost reports, folders, budgets, anomalies, recommendations, tags, financial commitment reports, business metrics, providers and integrations (233 tools, 123 of them mutations that need approval).

**Interface:** Vantage's official OpenAPI 3 document, `https://api.vantage.sh/v2/oas_v3.json`, compiled live against `https://api.vantage.sh/v2`. This is the "Vantage MCP" catalog target: the official MCP server (`https://mcp.vantage.sh/mcp`, OAuth with dynamic client registration) is the same product, and the REST API exposes a superset of operations, and both are mounted: an account connected with an API token gets the REST tools, an account connected with OAuth gets the MCP server's tools (the MCP probe returns 401 without auth, so its tool list could not be checked here; its analysis helpers are only available through the OAuth account).

**Auth:** API token. Create one in the Vantage console under Settings, API Access Tokens (https://console.vantage.sh/settings/access_tokens), with read and, if you want write tools, write scope. The token is sent as a bearer header. The spec labels its scheme `oauth2` (client credentials with a console page as token URL); it is overridden as a bearer token because that is how the API works. No OAuth flow is offered for the REST API. **OAuth:** connect with OAuth to use the official MCP server (`oauth2` discovery against `https://mcp.vantage.sh`, dynamic client registration). MCP tools require approval unless annotated read-only.

**Known gaps:** Each account uses one interface: connect both an API token account and an OAuth account to have both tool sets.
