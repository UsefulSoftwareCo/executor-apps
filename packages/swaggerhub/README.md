# SwaggerHub

Manage SwaggerHub: APIs and API versions (create, update, clone, fork, delete, lifecycle and visibility settings, default version), domains, templates, projects, integrations, comments and replies, standardization status, plus organizations, members, teams, roles and resource permissions.

Interface: OpenAPI, from SmartBear's official documents published on SwaggerHub itself, pinned to a version and mounted as two routers on `https://api.swaggerhub.com`:

- `registry`: Registry API 1.4.0 (Swagger 2.0), https://api.swaggerhub.com/apis/swagger-hub/registry-api/1.4.0/swagger.json (86 tools).
- `users`: User Management API 2.5.0 (OpenAPI 3.0, 18 tools), https://api.swaggerhub.com/apis/swagger-hub/user-management-api/2.5.0/swagger.json (served under `/user-management/v1`).

Docs: https://support.smartbear.com/swaggerhub/docs/en/manage-resources/swaggerhub-apis.html

## Auth

- API key: copy your personal key from https://app.swaggerhub.com/settings/apiKey. It is sent in the `Authorization` header. Write operations in the User Management API need the key of an organization owner.

SwaggerHub's remote MCP server (https://swagger.mcp.smartbear.com/mcp) uses SmartBear OAuth with dynamic client registration; it is not used here.

## Known gaps

- Only SwaggerHub SaaS (`api.swaggerhub.com`); On-Premise servers are not supported.
- Ten Registry API operations declare their body as a shared Swagger 2.0 parameter that the converter rejects; `openapi.ts` patches them inline.
- The icon is the Swagger mark from Simple Icons (SwaggerHub's brand), as SwaggerHub has no distinct mark.
