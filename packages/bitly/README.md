# Bitly

Link management with Bitly: shorten and edit links, branded short domains (BSDs), QR codes, campaigns, groups, organizations, webhooks and click analytics.

**Interface:** Bitly's official OpenAPI document, https://dev.bitly.com/v4/v4.json (142 operations, 46 mutations; all mutations require approval). Bitly also runs an official MCP server at https://api-ssl.bitly.com/v4/mcp, whose tool list was not compared (it requires OAuth credentials to read).

**Auth**
- Generic access token: create one at https://app.bitly.com/settings/api ("Generic access token"). Sent as a bearer token.
- OAuth 2.0: register an OAuth app from the Bitly developer settings (start at https://app.bitly.com/settings/api) and enter its client ID and secret on the connect page. Add the Executor redirect URI shown there to the app's redirect URIs. Bitly has no scopes.

**Gaps:** some endpoints (BSDs, QR codes, campaigns) depend on the Bitly plan.
