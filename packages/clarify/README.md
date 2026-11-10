# Clarify

Clarify, the AI-native CRM: records (people, companies, deals, meetings and custom objects), lists, schemas and fields, comments, attachments, access grants, workflows, campaign recipients, workspace users, invitations and settings. This package also covers the catalog target "Clarify MCP".

**Interface:** Clarify's official OpenAPI 3.1 document, `https://api.clarify.ai/swagger-json` (docs: https://developer.clarify.ai/docs/resources/openapi-spec), against `https://api.clarify.ai/v1`. It yields 80 tools (51 mutations, which require approval), more than the 46 tools of the official MCP server (`https://api.clarify.ai/mcp`, OAuth with dynamic client registration), so the MCP server is not mounted. Not to be confused with clarify.io, an unrelated industrial time-series platform.

**Auth:** API key only. Create one in Clarify under Settings > API Keys (https://app.clarify.ai/redirect/settings/api-keys). A Personal key acts as the user and reaches everything they can; a Workspace key (admins only) is limited to public workspace data. The connection also asks for the workspace slug (the `{slug}` segment of your Clarify workspace URL, `app.clarify.ai/<slug>`), used for the health check `GET /v1/workspaces/{slug}` because `GET /v1/workspaces` accepts only user Bearer tokens. The key is sent as `Authorization: api-key <key>`, not Bearer. Clarify's OAuth 2.0 for the REST API is only for partner apps registered through support@clarify.ai, so it is not offered.

**Known gaps:** 11 operations accept only a user Bearer access token (they act as a specific person) and are skipped because API keys cannot call them. Meeting recording and transcript upload endpoints take file or media bodies that may not suit tool calls. The MCP server's OAuth flow is not exposed.

Icon: the Clarify mark from the clarify.ai site header.
