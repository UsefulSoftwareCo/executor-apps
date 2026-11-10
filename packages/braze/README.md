# Braze

Braze customer engagement: campaigns, Canvases, segments, catalogs, custom attributes and events, CDI integrations, KPIs, purchases, sends, sessions, email templates, content blocks and the media library (71 tools).

## Interface

Braze's official remote MCP server, `https://mcp.braze.com/mcp` (the EU-hosted twin is `https://mcp.braze.eu/mcp`; the US endpoint reaches every cluster). Docs: https://www.braze.com/docs/user_guide/brazeai/mcp_server. Each tool except the three Operator tools (`send_operator_prompt`, `get_operator_result`, `cancel_operator_job`) maps to a Braze REST endpoint; the Operator tools do not. Call `get_workspaces` first: each workspace id is the `app_group_id` the other tools require. Mutating tools require approval; only tools annotated read-only run without it.

Why not the REST API: Braze publishes only one OpenAPI file per endpoint (no single document at a stable URL) and the REST host depends on the customer's cluster, so the MCP server is the more practical official surface. The REST API with an API key exposes a larger surface, but the MCP server deliberately excludes user-level PII endpoints (per the Braze docs), so the gap is a deliberate choice and the REST API is not packaged. The 71 tools are the sum of the 16 categories on https://www.braze.com/docs/user_guide/brazeai/mcp_server/available_api_functions.

## Auth

OAuth 2.0 with dynamic client registration, discovered from the server (authorization server `dashboard.braze.com`, scopes `mcp:tools`, `mcp:resources`). Sign in with your Braze dashboard user (SSO works); access follows that user's dashboard permissions, so no API key or OAuth app is needed. The redirect URI is the one Executor shows when connecting.

## Known gaps

- The server is early access (announced July 2026); about 21 campaign, segment and Operator tools are beta and error unless your account is enrolled.
- Customers using Braze IP allowlisting cannot use the MCP server yet.
- REST-API-key auth is not offered, and `/users/export/*` and user tracking endpoints are not exposed by the MCP server. The `mcp:operator` scope is not requested.
