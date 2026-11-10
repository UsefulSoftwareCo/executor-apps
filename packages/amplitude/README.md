# Amplitude

Amplitude product analytics: search and query charts, dashboards, events, users,
cohorts, experiments and feature flags from Amplitude's hosted MCP server.

Interface: Amplitude's official remote MCP servers, US `https://mcp.amplitude.com/mcp`
and EU data residency `https://mcp.eu.amplitude.com/mcp`
(docs: https://amplitude.com/docs/analytics/amplitude-mcp). Tools are whatever the
server lists for the account; the list needs credentials, so no tool count is
verified here (the vendor docs list about 45 tools). Tools appear under `us` or
`eu`, matching the account type you connect. Amplitude's REST APIs (HTTP V2
ingestion, Export, Dashboard REST, Taxonomy) have no OpenAPI document that was found
at a stable official URL, so the MCP servers are the interface.
Auth, one account type per region (`Amplitude`, `Amplitude (EU)`):

- OAuth (`oauth`): each server publishes OAuth metadata and a dynamic client
  registration endpoint (`/register`), so Executor registers its own client; no
  manual OAuth app is needed. Scopes come from the servers' metadata (`all:read`,
  `all:write`, `offline_access`). Sign in with an Amplitude user that has access to the
  target project, in one Amplitude org only. Executor's redirect URI is shown on
  the connect page (framework behaviour).

Approvals: every tool the server does not mark read-only asks for approval.
Amplitude also enforces per-project RBAC (Use MCP read/write) on each call.

Known gaps: API key plus secret key (Basic auth) access to the REST APIs is not
offered. Account health only verifies the token reaches the MCP server. The icon is
the Amplitude symbol from the brand guide (https://brand.amplitude.com/), SVG
https://framerusercontent.com/images/vqninpQZmsdOKgDIl5C4C1e3Q.svg.
