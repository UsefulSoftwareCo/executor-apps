# GetResponse

Email marketing with GetResponse: contacts, lists (campaigns), newsletters, autoresponders, automation workflows, landing pages, webinars, forms, tags, custom fields, ecommerce and account settings.

**Interface:** OpenAPI 3.0 document published by GetResponse for API v3, `https://apireference.getresponse.com/open-api.json`. It compiles to 220 tools (94 mutations, all gated by approval), none skipped.

**Auth**
- API key (`apiKey`): create one in GetResponse under Integrations and API > API. Sent as `X-Auth-Token: api-key <key>`.
- OAuth 2.0 (`oauth`): register your own OAuth app in GetResponse (see the OAuth section of the GetResponse API docs) and enter its client ID and secret on the connect page. Set the redirect URL in the application settings to the Executor redirect URI shown on the connect page. Single scope `all`; the token endpoint uses HTTP Basic client authentication.

**Known gaps**
- Only `api.getresponse.com` is wired. GetResponse MAX accounts use `api3.getresponse360.com` (US) or `api3.getresponse360.pl` (PL) and are not supported.
- The OAuth token request details come from the OpenAPI security scheme and are untested against a live OAuth app.
- The icon is GetResponse's official 192px app icon (no SVG is published and Simple Icons has none).

GetResponse also runs an official remote MCP server at https://mcp.getresponse.com (OAuth); this package uses the OpenAPI document instead.
