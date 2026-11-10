# Streamtime

Jobs, companies, contacts, invoices, quotes, job items, phases, time tracking and scheduling in Streamtime (project management for creative businesses), through its public v2 API.

**Interface:** OpenAPI 3.1 document published by Streamtime at https://api.streamtime.net/v2/swagger.json (Swagger UI at https://api.streamtime.net/v2/swagger), base URL `https://api.streamtime.net/v2`. 85 operations. The v2 API is marked beta by Streamtime; v1 is to be deprecated towards the end of 2026.

**Auth:** API token (`apiKey`), sent as `Authorization: Bearer <token>`. The account subscriber creates it in Streamtime under Settings, Integrations, API section, Connect. Streamtime offers OAuth only to approved Partners, so there is no user-created OAuth app option.

**Known gaps:** Streamtime also runs an official remote MCP server (`https://mcp.streamtime.net`, OAuth with dynamic client registration, beta; Streamable HTTP only, per Streamtime's help center). It is not mounted here because the OpenAPI document already covers the API; it could be added under an `mcp` key. Rate limits are 60 requests per minute and 720 per hour, plus processing-time limits of 30 seconds per minute and 300 seconds per hour; exceeding any limit returns 429. Invoice PDF and HTML endpoints return non-JSON bodies.
