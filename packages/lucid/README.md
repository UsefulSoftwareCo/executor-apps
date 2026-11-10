# Lucid

Search, read, summarize, create, share and export Lucid (Lucidchart and Lucidspark) documents, diagrams, mind maps, sequence diagrams and org charts.

**Interface:** Lucid's official remote MCP server, `https://mcp.lucid.app/mcp` (streamable HTTP; see https://github.com/lucidsoftware/lucid-mcp-server and https://help.lucid.co/hc/en-us/articles/42578801807508). Tools are discovered live from the server. Tools without `readOnlyHint` require approval.

**Auth:** OAuth 2.0 with dynamic client registration, discovered from the server's metadata. There is no API key and no OAuth app to create. On Team and Enterprise accounts an admin must first enable MCP access (Admin > Security > Feature controls); Free and Individual plans have no admin toggle. The server is unavailable on FedRAMP accounts. The `offline_access` scope is requested so refresh tokens are issued. The redirect URI is registered automatically.

**Known gaps:** Lucid's REST API (https://api.lucid.co, roughly 174 endpoints: documents, folders, sharing, users, teams, legal holds, audit logs) is not covered; this package is MCP-only. MCP is the chosen interface because Lucid publishes no OpenAPI spec for the REST API, and REST access needs a developer-created OAuth client or a Team/Enterprise API key, whereas MCP works with a one-click OAuth login on any plan. Narrower endpoints (`/mcp/readonly`, `/mcp/repositories`) are not mounted.

**Icon:** the mark is Lucidchart's product icon; Lucidspark has its own separate icon, which is not used here.
