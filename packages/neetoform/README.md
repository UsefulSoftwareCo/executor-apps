# NeetoForm

Covers NeetoForm, the online form builder: workspaces, forms (list, search, fetch), completed submissions, and team members (list, get, invite, update, deactivate).

**Interface:** NeetoForm's official hosted remote MCP server, `https://connect.neetoform.com/mcp/messages` (docs: https://apidocs.neetoform.com/mcp/introduction, tools: https://apidocs.neetoform.com/mcp/tools). The vendor also publishes OpenAPI documents (https://apidocs.neetoform.com/bundled/forms.yaml and siblings), but their server URL is per-workspace (`https://{subdomain}.neetoform.com/api/external/v2`) and they cover the same few operations, so the MCP server is used: it needs no subdomain and supports OAuth. The vendor documents about 10 tools (`ListWorkspaces`, `ListForms`, `ListSubmissions`, `search`, `fetch`, `ListTeamMembers`, `GetTeamMember`, `CreateTeamMember`, `UpdateTeamMember`, `DeleteTeamMember`). Any tool without `readOnlyHint` requires approval.

**Auth:**
- API key: a workspace API key, passed as `Authorization: Bearer <key>` to the MCP server. Create it in the NeetoForm Admin panel, API keys, Add API key, type General (https://help.neetoform.com/articles/api-keys). One key reaches one whole workspace.
- OAuth: `oauth2({ discover: "https://connect.neetoform.com/mcp/messages" })`. The server publishes RFC 9728 and RFC 8414 metadata, dynamic client registration and PKCE S256, so no pre-registered OAuth app is needed. Scopes (`read`, `write`, `delete`, `offline_access`) come from the server's metadata; the user chooses which to grant when approving. The redirect URI is the one Executor shows when connecting. One OAuth connection can reach several workspaces; tools take an optional `workspace` subdomain argument.

**Known gaps:** The tool list comes from the server at runtime and was not exercised with real credentials. There is no form creation tool in MCP (the REST API has one), and no REST fallback is wired up.
