# MongoDB

Covers MongoDB Atlas: organizations, projects, clusters, database users, network access, backups, alerts, search indexes, private endpoints, auditing, billing and the rest of the Atlas Administration API (522 operations, mutations require approval).

The catalog target was "MongoDB MCP". MongoDB's official MCP server (`mongodb-mcp-server`) is a local stdio process with no hosted endpoint, so this package uses the official Atlas Administration API OpenAPI document instead: https://www.mongodb.com/docs/api/doc/atlas-admin-api-v2.json (server `https://cloud.mongodb.com`). Atlas requires versioned `Accept` media types; these come from the document.

## Auth

- Service account (OAuth 2.0 client credentials): in Atlas, go to Organization (or Project) Access Manager > Applications > Service Accounts, create an account, grant it the roles it needs (permissions come from the roles, no scopes), and copy the client ID and secret. Executor exchanges them at `https://cloud.mongodb.com/api/oauth/token`. If you restrict the account with an IP access list, add Executor's egress addresses.

## Gaps

- Legacy Atlas API key pairs (HTTP Digest) are not supported; use a service account.
- Database data access (documents, queries) is not part of the Atlas Administration API; the local MongoDB MCP server covers that.
- The health check calls the authenticated `GET /api/atlas/v2/groups?itemsPerPage=1` (list projects), which requires a valid bearer token and works for organization- and project-scoped service accounts. It returns no per-account identity, so accounts show no username.
- Not exercised with real credentials.
