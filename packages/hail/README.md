# Hail

Hail gives AI agents and backends email, SMS and agentic phone calls through one account. This package covers the whole REST API: agents, calls, phone numbers, emails and attachments, email domains, SMS and suppressions, contacts, webhooks, providers and verifications.

Interface: OpenAPI, loaded live from the vendor's official document at https://api.hail.so/openapi.json. Mutations require approval.

Auth: API key. Create one in your Hail dashboard (keys start with `hl_live_`); it is sent as a Bearer token to `api.hail.so`. Health check calls `GET /v1/whoami`.

Known gaps: Hail also offers an OAuth 2.1 MCP server at https://mcp.hail.so (dynamic client registration); it is not mounted because the REST API already covers the same capabilities. The spec declares no security scheme, so the Bearer scheme is declared here. The document also lists the unauthenticated `/healthz` and `/v1/unsubscribe` endpoints.
