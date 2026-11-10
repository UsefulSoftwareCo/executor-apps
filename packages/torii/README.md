# Torii

Covers the Torii SaaS management API: apps, contracts, users, roles, licenses, transactions, audit logs, workflows, files and organization data (74 tools, 34 of them mutations, which always require approval).

Interface: OpenAPI, the official document at https://developers.toriihq.com/openapi/torii-api-documentation.json (also used by Torii's own CLI), fetched live. API base URL `https://api.toriihq.com/v1.0`.

Auth: API key only. Torii does not offer user-created OAuth apps. Create the key in the Torii dashboard under Settings > API (admin access required); it is sent as `Authorization: Bearer <key>`.

Known gaps: Torii also offers an MCP server for its own customers, but it is not publicly documented, so it is not mounted here.
