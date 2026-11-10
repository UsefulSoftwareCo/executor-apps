# Gorgias

Tickets, messages, customers, macros, rules, views, tags, teams, help center articles, AI Agent configuration, support actions, segments, widgets and reporting for one Gorgias account (about 155 tools).

**Interface:** Gorgias's official remote MCP server, `https://mcp.gorgias.com/mcp`. Gorgias publishes no complete OpenAPI document (only per-endpoint reference pages), and the MCP server covers far more than the REST reference, so MCP is used.

**Auth:** OAuth 2.0 only, discovered from the server's metadata (dynamic client registration, PKCE). Connect and sign in to your Gorgias account in the browser; no OAuth app or redirect URI needs to be created by hand. The REST API's API-key (Basic auth) method is not available through the MCP server. The account is tied to one Gorgias tenant at sign-in.

**Beta:** Gorgias documents the MCP server as beta. You enter your Gorgias subdomain in the browser during sign-in; multi-brand setups can pass an optional `gorgias_subdomain` query parameter. Requested scopes cover tickets, customers, macros, rules, views, tags, help center, AI Agent and reporting, plus `offline` for refresh tokens; billing, user/account writes and integration writes are not requested, so tools needing them may be refused.

**Approvals:** every tool not annotated read-only requires approval.

**Gaps:** the REST API itself (`https://{subdomain}.gorgias.com/api`, with Basic auth or OAuth apps) is not exposed; only what the MCP server offers.
