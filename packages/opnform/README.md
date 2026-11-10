# OPNForm

Manage OPNForm (open-source form builder) workspaces, forms, submissions, exports, workspace members and invites, and webhook integrations. A second connection method exposes OPNForm's official MCP server for form authoring and publishing.

**Interface:** OpenAPI, from OPNForm's official document at https://docs.opnform.com/api-reference/openapi.yaml (35 tools, 21 mutations, all mutations require approval). Base URL `https://api.opnform.com`.

**Auth:** two methods, each mounting a different interface on the same host (`api.opnform.com`).
- `apiKey` (REST tools): a personal access token, sent as `Authorization: Bearer <token>`. Create one in the OPNForm dashboard under the "API Keys" section (the vendor docs give no exact menu path) and grant the abilities you need (`workspaces-read`, `workspaces-write`, `workspace-users-read`, `workspace-users-write`, `forms-read`, `forms-write`; add `manage-integrations` for webhook tools). The health check calls `/external/zapier/validate`, which the spec declares with only the default bearer auth and no ability scope; it was not tested with a real token.
- `oauth` (MCP tools): OAuth against `https://api.opnform.com/mcp`, discovered from RFC 8414 metadata (`/.well-known/oauth-authorization-server`), dynamic client registration at `/oauth/register`, PKCE S256, public client, scope `mcp:use`. The server is live (anonymous initialize returns 200, serverInfo OpnForm 1.0.0) and lists 20 tools: 6 guest-draft tools needing no auth and 14 OAuth tools (accounts, workspaces, forms create/update/publish/trash, submissions, stats, exports). It adds form authoring and publishing that the REST spec lacks, while REST covers workspace members, invites and webhook integrations that the MCP lacks. Mutating MCP tools require approval unless marked read-only. Redirect URI: use the one shown on Executor's connect page.

Connect both methods as separate accounts to get both toolsets. Whether a REST personal access token is accepted by the MCP, or an MCP OAuth token by the REST API, is unverified; the package assumes not.

**Known gaps:**
- The REST API itself has no OAuth; OAuth applies only to the MCP server.
- Cloud only: the host is fixed to `api.opnform.com`, so self-hosted instances are not supported.
- The spec includes a few legacy Zapier endpoints under `/external/zapier`.
