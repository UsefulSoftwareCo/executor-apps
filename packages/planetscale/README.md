# PlanetScale

Organizations, databases, branches, deploy requests, backups, passwords, workflows, traffic budgets and Insights across PlanetScale's MySQL (Vitess) and Postgres products.

**Interface:** PlanetScale's official OpenAPI document, https://planetscale.com/docs/openapi.yaml (API base `https://api.planetscale.com/v1`). 304 tools, 150 of them mutations (each requires approval), none skipped. PlanetScale also hosts MCP servers (`https://mcp.pscale.dev/mcp/planetscale`, OAuth); they are not mounted because the REST API is a superset.

**Auth**

- Service token (`token`): create one under Organization settings > Service tokens in the PlanetScale dashboard, grant it the database/organization permissions you need, then paste `SERVICE_TOKEN_ID:SERVICE_TOKEN` as a single value. It is sent verbatim as the `Authorization` header, as PlanetScale requires.
- OAuth (`oauth2`): PlanetScale OAuth applications are created in the organization's settings (OAuth applications). Register the redirect URI Executor shows on the connect page. Endpoints come from `https://api.planetscale.com/.well-known/oauth-authorization-server`. Requested scopes cover reads and writes for databases, branches, deploy requests, backups, passwords and workflows; they exclude deleting the organization, SSO, invoices and payment methods.

**Known gaps**

- The document declares only `oauth2` globally, so the global security is removed and a fallback accepting OAuth or a service token is declared.
- The health check only verifies credentials by listing organizations; it does not identify the user.
- Service tokens only work for the permissions they were granted.
