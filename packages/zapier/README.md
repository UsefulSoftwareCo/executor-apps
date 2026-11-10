# Zapier

Exposes the actions a user has enabled in Zapier MCP (https://zapier.com/mcp), which can run actions across thousands of apps connected to the user's Zapier account.

Interface: Zapier's official remote MCP server, `https://mcp.zapier.com/api/v1/connect` (Streamable HTTP). Tools are whatever the user adds to their MCP server at https://mcp.zapier.com; mutating tools require approval unless annotated read-only.

Auth: two methods. (1) Connection token: create or open a server at https://mcp.zapier.com and generate its connection token; it is long-lived, bound to that one server, and shown only once, so copy it immediately. It is sent as `Authorization: Bearer <token>`. (2) OAuth 2.0, discovered from the server's published metadata (dynamic client registration, PKCE), scopes `openid profile email`; no client setup is needed, the user signs in to Zapier and picks the MCP server configuration to grant. The redirect URI is the one Executor supplies at connection time.

Known gaps: Zapier's Workflow API (`api.zapier.com`, OAuth app registered with Zapier) and the Zapier NLA / SCIM APIs are not covered. NLA is deprecated, and the others need an app registration or an enterprise plan. The tool list depends on the user's MCP configuration, so it is empty until actions are added.
