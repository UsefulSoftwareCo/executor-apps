# HiBob

Employees, time off, tasks and reports in HiBob (Bob), through HiBob's official remote MCP server at `https://mcp.hibob.com/mcp/public` (docs: https://apidocs.hibob.com/docs/hibob-mcp-server and the Bob Help Center article "Use Bob MCP Server"). The tool list is whatever the server exposes to the signed-in user, so access follows that user's Bob permissions.

## Auth

Two methods.

- OAuth (MCP): the server publishes OAuth metadata and supports dynamic client registration, so Executor registers itself and the user signs in to Bob and approves. Scopes: `mcp:tools:read`, `mcp:tools:execute`. The redirect URI is the one Executor shows when connecting. The user needs the Bob MCP feature enabled for their company. The tool list is dynamic and was not probed without an authenticated session, so no tool count is recorded.
- Service user (secrets): service user ID and token, sent as HTTP Basic to `https://api.hibob.com/v1`. Create one in Bob under Settings > Integrations > Service users and grant it the permissions the tools need. Health check is `GET /v1/company/named-lists`. This account exposes 21 hand-written REST tools (people search/read/update/create, profiles, fields, named lists, time off who's out/requests/balances/policy types, tasks, reports list/download). HiBob publishes no downloadable OpenAPI document (developers.hibob.com/openapi.json is blocked and no APIs.guru entry exists), so these follow the docs at https://apidocs.hibob.com. Pass path ids as arguments, filters in `query`, JSON in `body`.

Not covered: the marketplace-partner OAuth flow at `auth.app.hibob.com` (needs a registered partner app).

Mutating tools (non-read-only MCP tools, and all non-GET REST tools except people search/read) require approval.
