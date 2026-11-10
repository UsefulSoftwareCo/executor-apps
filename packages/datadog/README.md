# Datadog

Search and query Datadog logs, metrics, traces and spans, monitors, incidents, dashboards, notebooks, events, services, hosts, RUM, error tracking, security signals, cases, synthetics, workflows and the other generally available toolsets of Datadog's MCP server. Read-only tools (`readOnlyHint`) run without approval; every other tool asks.

## Interface

Datadog's official remote MCP server ([setup docs](https://docs.datadoghq.com/bits_ai/mcp_server/setup/)), at `https://mcp.<site>/api/unstable/mcp-server/mcp?toolsets=all` for the account's site. `toolsets=all` enables every generally available toolset; without it Datadog exposes only `core`. Preview toolsets (APM, governance, investigator, live debugger, observability pipelines, remote actions) need sign-up and are not requested.

Datadog's v1 and v2 OpenAPI documents (1,891 tools) were used before, but their tool listing is 16.8 MB and fails on hosted Executor (see `catalog/cloudflare-large-specs.md`), so the package now uses the MCP server only.

## Auth

Every method is tied to one Datadog site: `datadoghq.com` (US1), `us3.datadoghq.com`, `us5.datadoghq.com`, `datadoghq.eu`, `ap1.datadoghq.com`, `ap2.datadoghq.com` or `uk1.datadoghq.com`.

- **API key and application key** (`keys`): enter the site and both keys (Organization Settings > API Keys and Application Keys; Datadog suggests a service account's scoped keys). Sent as the `DD_API_KEY` and `DD_APPLICATION_KEY` headers, as Datadog documents for the MCP server.
- **Access token** (`token`): the site and a Personal Access Token (Personal Settings) or a service account's access token, sent as `Authorization: Bearer`. Datadog's preferred header method.
- **OAuth** (`oauthUs1`, `oauthUs3`, `oauthUs5`, `oauthEu1`, `oauthAp1`, `oauthAp2`, `oauthUk1`): pick the method for your site. Each site publishes its own authorization server at `mcp.<site>` with dynamic client registration, S256 PKCE and public clients, so Executor registers its client automatically (`tokenEndpointAuthMethod: none`, scope `mcp_all`). Revoke under Personal Settings > Authorized Apps.

The user needs the `mcp_read` (and for write tools `mcp_write`) permissions, and an org admin must enable MCP Access (and MCP Write Access) in Organization Settings.

Health check: `mcpHealth` (initialize and list tools with the account's credentials).

## Known gaps

- GovCloud sites (`ddog-gov.com`, `us2.ddog-gov.com`) have no MCP server and are no longer supported.
- The MCP server covers fewer operations than the REST API (no bulk configuration of every resource type); Datadog describes it as under active development.
- Tool count not listed live (listing needs a real account).
