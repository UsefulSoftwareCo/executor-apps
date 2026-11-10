# Memberstack

Manage Memberstack projects: members, subscription plans, data tables and records, gated content, and documentation search, in both LIVE and SANDBOX environments.

Interface: Memberstack's official remote MCP server at `https://mcp.memberstack.com/mcp` (71 tools at the time of writing; the server describes itself as beta in the Memberstack dashboard and may change). Memberstack's Admin REST API (`https://admin.memberstack.com`, `X-API-KEY` secret key) has no published OpenAPI document and covers only a handful of endpoints, so the MCP server is used instead.

Auth: OAuth 2.1 with PKCE and dynamic client registration, discovered from the server's metadata (scopes `read` and `write`). Sign in with your Memberstack dashboard credentials when connecting; no OAuth app needs to be created. Secret-key (API key) auth is not offered because the MCP server only advertises OAuth 2.1 (this was not tested with a secret key). The Admin REST API (X-API-KEY) is therefore a known gap.

Approvals: every tool without a `readOnlyHint` requires approval.

Known gaps: the tool list may change as the server evolves. Icon is the mark cropped from Memberstack's official full logo PNG.
