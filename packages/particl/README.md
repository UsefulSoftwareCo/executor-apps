# Particl

Read-only market intelligence from Particl: companies, products, pricing, sales estimates and marketing activity across ecommerce.

**Interface:** Particl's official remote MCP server (streamable HTTP), `https://mcp.particl.com/mcp` (listed at integrations.sh). Listing tools needs credentials, so the tool count is not verified here. The probe confirms the server answers 401 with OAuth protected-resource metadata. No public OpenAPI document was found.

**Auth**
- OAuth (`oauth`): the MCP resource's protected-resource metadata names `https://mcp.particl.com` as its authorization server, but that server's metadata reports issuer `https://clerk.particl.com`, which Executor's issuer check rejects. The app therefore discovers from `https://clerk.particl.com` (PKCE S256, dynamic client registration, hosts `mcp.particl.com` and `clerk.particl.com`), so Executor registers its own client; no manual OAuth app is needed. The redirect URI is shown on the connect page. The root protected-resource metadata lists openid, email, profile and offline_access (the `/mcp` document lists none); the app requests `offline_access` explicitly so a refresh token is issued.

**Approvals:** every tool the server does not mark read-only asks for approval.

**Known gaps:** integrations.sh mentions a Particl-issued bearer API key, but no API-key creation flow was documented, so only OAuth is offered. Account health only verifies the token reaches the MCP server. The icon is the Particl mark from the official press kit (https://particl.com/assets/particl-press-kit.zip).
