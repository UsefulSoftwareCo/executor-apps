# Extrovert

Manage [Extrovert](https://www.goextrovert.com) LinkedIn prospect engagement: campaigns (Prospects and Topic), prospect lists and prospects, monitored topics, voices (talking points, selling points, comment examples and DM templates), writing styles, workspace plan features and team members.

**Interface:** OpenAPI, the vendor's official Client API document at https://api.goextrovert.com/client/v2/docs-json (docs: https://api-docs.goextrovert.com). Tools are generated live from that document. All REST requests go to https://api.goextrovert.com. An OAuth connection instead uses the vendor's official remote MCP server at https://mcp.goextrovert.com, which adds Lead Finder.

**Auth:**
- API key (`apiKey`), sent as the `X-API-Key` header, for the REST tools. Create it in Extrovert under Settings > Integrations (https://app.goextrovert.com/dashboard/settings/integrations). The plan must include API access, otherwise requests return 403. The health check reads the workspace plan features.
- OAuth (`oauth`), for the MCP tools. The server publishes OAuth metadata (authorization code with S256 PKCE, refresh tokens, dynamic client registration), so no OAuth app needs to be created by hand. Executor supplies the redirect URI during registration.

An account uses one method: API key accounts expose the REST tools, OAuth accounts expose the MCP tools. MCP tools without a read-only hint require approval.

**Known gaps:** The published REST document has no context, insight or DM playbook endpoints (the vendor docs describe those resources), and no webhooks or Intent Signals. Lead Finder is only available through the MCP server (OAuth account). Legacy `/api/client/v1` prospect endpoints are included as published.
