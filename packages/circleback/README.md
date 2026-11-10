# Circleback

Meetings, transcripts, notes, action items, calendar events, emails, people and companies from Circleback, plus its support documentation, for agents.

**Interface:** Circleback's official remote MCP server at `https://app.circleback.ai/api/mcp` (probe verdict: `oauth`). Tools are listed by the server after you connect. Circleback also has a bearer-token REST API, but it publishes no OpenAPI document, so the MCP server is used.

**Auth:** OAuth 2.0 with PKCE (S256) and dynamic client registration, discovered from the server's metadata (scopes `user`, `user:write`). Sign in with your Circleback account when you connect; there is no client to create by hand. Circleback accepted an https redirect URI at registration, so the hosted Executor callback (`/api/oauth/callback` on your Executor origin) works. Tools that are not marked read-only require approval.

**Gaps:** The tool list requires an authenticated session, so the count is unverified and a full OAuth connect was not tested. No API-key auth is offered for the MCP server.

**Icon:** Circleback's official app icon (the apple-touch-icon from circleback.ai); Simple Icons has no Circleback entry and the site's SVG logo is a wordmark.
