# Softr

Manage Softr Databases: list, create, update and delete databases, tables, table fields and records, including record search with filters, sort and pagination.

**Interface:** OpenAPI. Softr's official Database API document at https://docs.softr.io/openapi.yaml (server `https://tables-api.softr.io/api/v1`).

**Auth:** API key only. Softr offers no OAuth for its API. Create a Personal Access Token in the Softr Dashboard (workspace menu, API tokens), choose its scopes and expiry, and paste it in; it is sent in the `Softr-Api-Key` header. Tokens are scoped to specific workspaces and are shown only once. The token inherits the creating user's workspace access.

**MCP:** Softr's official hosted MCP server (`https://mcp.softr.io/mcp`) is mounted under the `mcp` key via a separate "Softr MCP" account. It adds apps, pages, blocks, permissions, publishing, vibe-coding blocks, integrations, workflows and app-user management on top of the 21 database operations (mounted under `database`). Auth is a personal access token (sent as `Authorization: Bearer`, per https://docs.softr.io/mcp/connect) or OAuth (authorization server `https://studio-api.softr.io`, discovered). Softr does not support dynamic client registration, so OAuth needs a pre-registered client ID; the token path is the simpler one. Whether the Database API key and the MCP token are interchangeable is not documented, so they are separate accounts.

**Gaps:** The Users Management API (`studio-api.softr.io`, create/delete app users) is documented only as prose, not in the OpenAPI document, and needs a per-app `Softr-Domain` header, so it is not included as a Database tool; app-user management is available through the `mcp` tools.
