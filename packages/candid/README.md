# Candid

Research nonprofit organizations, funders, funding opportunities, social-sector knowledge and related news with Candid data (candid.org, formerly GuideStar and Foundation Center). Candid's own materials list a REST developer portal and a Taxonomy GraphQL API, but both need separate paid or approved API keys, so this package uses the official remote MCP server.

**Interface:** Candid's official remote MCP server, `https://mcp.candid.org/mcp` (found via integrations.sh, confirmed with the MCP probe). Tools are discovered at runtime. Every tool that is not marked read-only asks for approval.

**Auth:** OAuth 2.0 only. The server publishes RFC 9728/8414 metadata and supports dynamic client registration (PKCE S256), so there is no app to create: connect and sign in with a Candid account. Scopes requested: `openid profile email`. Redirect URIs are registered dynamically by Executor. There is no API-key option on the MCP server.

**Gaps:** The REST developer APIs and the Taxonomy GraphQL API are not exposed. The server's tool list could not be inspected without an account.
