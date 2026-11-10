# n8n

Manage an n8n instance: workflows (create, update, activate, transfer), executions, credentials, tags, variables, users, projects, data tables, source control, security audit and community packages (168 tools, 110 of them mutations, none skipped).

**Interface:** OpenAPI, from a vendored snapshot (`spec.json`) of n8n's official public API document. The upstream source is `packages/cli/src/public-api/v1/openapi.yml` in https://github.com/n8n-io/n8n, which is split across files with relative references and cannot be compiled directly; n8n publishes no stable URL for the bundled file. The snapshot is the bundled document served by an n8n Cloud instance (https://internal.users.n8n.cloud/api/v1/openapi.yml, an undocumented host used only to take the snapshot, not at runtime), converted from YAML to JSON unchanged. Refresh it by re-fetching that file when n8n ships new endpoints. The document's servers are relative to the instance; each account supplies its own instance URL, and credentials are only sent to that origin.

**Auth:** API key. In the n8n editor open Settings > n8n API and create an API key. Enter the instance URL (for example `https://your-instance.app.n8n.cloud` or your self-hosted URL; a trailing `/api/v1` is accepted) and the key. It is sent as the `X-N8N-API-KEY` header. n8n has no user-created OAuth apps for the public API, so there is no OAuth option.

**Gaps:** the instance must be reached over https (http is allowed only for localhost). Which endpoints work depends on the n8n edition and plan and the key's scopes; some (projects, variables, source control, users) need paid or enterprise features. The instance's built-in MCP server is not mounted.
