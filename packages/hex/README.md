# Hex

Run and manage a Hex workspace: projects (create, export, run, sharing), runs and cell images, cells, threads and follow-ups, collections, groups, data connections and schemas, semantic projects, suggestions, guides, embedding URLs and users.

Interface: OpenAPI, Hex's official API description at https://static.hex.site/openapi.json (server `https://app.hex.tech/api`).

Auth: API token (`apiKey`) plus a plain `subdomain` field: `app` (multi-tenant, default), `eu`, `hc` (HIPAA multi-tenant) or your single-tenant name, so requests go to `https://<subdomain>.hex.tech/api`. Personal tokens (`hxtp_...`) are created in Hex under Account > API keys; workspace tokens (`hxtw_...`) need a workspace admin to enable API access under Workspace settings > Integrations first. Tokens are sent as a bearer token. Hex's MCP server uses OAuth, but the REST API does not accept OAuth, so no `oauth2` method is offered.

Known gaps: Hex also ships a remote MCP server at https://app.hex.tech/mcp, not used here because the REST API covers more operations.
