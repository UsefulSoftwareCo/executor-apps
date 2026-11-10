# Peaka

Covers the Peaka Partner API: organizations, workspaces, projects, project API keys, data connections (including OAuth2 connection callbacks), catalogs, schemas, tables, columns, queries and folders, semantic catalogs and caching.

**Interface:** OpenAPI 3.0, the vendor's official document at https://docs.peaka.com/api-reference/peaka-openapi.json (also in github.com/peakacom/docs). Calls go to the US zone, `https://partner.peaka.studio/api/v1`. All mutations require approval.

**Auth:** API key only. Peaka's Partner API is bearer-token based and has no user-created OAuth app flow. Create a Partner API key in the Peaka app under Developer, then Partner API Key. Project API keys are not supported: the vendor restricts them to project-scoped resources and the health check calls the partner-level `GET /organizations`. Docs: https://docs.peaka.com/api-reference/authentication

**Known gaps:** The EU zone (`partner.eu.peaka.studio`) is not supported; the package is pinned to the US host. The streaming chat endpoint `POST /ai-agent/{projectId}/chat/stream` (text/event-stream) is omitted because a tool cannot return SSE; use the non-streaming `POST /ai-agent/{projectId}/chat` instead.
