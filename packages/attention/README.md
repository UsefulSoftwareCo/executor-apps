# Attention

Covers the Attention (attention.com) sales conversation platform: conversations and transcripts, teams, users and roles, scorecards, labels, CRM field configurations and queries, snippets, knowledge base sources, the super agent, reports and SCIM provisioning (98 tools).

Interface: Attention's official OpenAPI 3 document, https://docs.attention.com/api-reference/openapi.json (server `https://api.attention.tech/v2`). Attention also runs an official MCP server at `https://api.attention.tech/mcp`; it was not mounted because the REST API already exposes the same areas.

Auth: API key only. In Attention go to Settings, Organization, API Keys (Admin role required) and create a key; it is shown once. It is sent as `Authorization: Bearer <key>`. The spec declares the scheme as a bare apiKey header, so `openapi.ts` overrides it to bearer per Attention's authentication docs. Attention offers no user-created OAuth apps for the REST API.

Known gaps: some POST endpoints that only read data (for example `/crm/query`) are treated as mutations and ask for approval. Media upload/download endpoints return presigned URLs only.
