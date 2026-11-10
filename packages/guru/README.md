# Guru

Covers the Guru knowledge platform: cards, collections, boards, groups, members, teams, announcements and analytics.

Interface: OpenAPI, generated from Guru's official document at https://api.getguru.com/api/v1/openapi.json (REST base `https://api.getguru.com/api/v1/`).

Auth: API token (HTTP Basic). Create it under Settings > Apps & Integrations > API Access in Guru (https://help.getguru.com/s/article/how-to-obtain-your-api-credentials). A user token (username is your Guru email) has read and write access as that user; a collection token (username is the collection ID) is read-only for one collection.

Known gaps: Guru's remote MCP server (https://mcp.api.getguru.com/mcp, OAuth with dynamic client registration) and the SCIM API (`/api/scim`, separate SCIM credentials) are not mounted. Every mutation requires approval.
