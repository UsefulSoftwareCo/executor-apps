# Confluence

Confluence Cloud pages, blog posts, spaces, comments (footer and inline), attachments, labels, folders, whiteboards, databases, smart links, tasks, custom content, properties and permissions through the Confluence Cloud REST API v2: 214 tools, 82 of them mutations (each requires approval).

**Search is not covered.** The v2 API has no CQL search, and the v1 API (`/wiki/rest/api`) is not included. For search, add Atlassian's official Rovo MCP server alongside this package; it exposes `searchConfluenceUsingCql` (and far fewer tools overall, which is why OpenAPI is the primary interface here).

Interface: OpenAPI, Atlassian's official Confluence Cloud v2 document at https://dac-static.atlassian.com/cloud/confluence/openapi-v2.v3.json (a static artifact host).

Tool counts by auth method: API token 214 tools (82 mutations); OAuth 218 tools (84 mutations, `cloudId` required). The 4 extra OAuth tools are the app-data operations, which the spec declares OAuth-only.

## Auth

- **API token** (`token`): site name (the `<site>` in `<site>.atlassian.net`), Atlassian account email, and an API token created at https://id.atlassian.com/manage-profile/security/api-tokens. Sent as Basic auth to `https://<site>.atlassian.net/wiki/api/v2`.
- **OAuth 2.0 (3LO)** (`OAuth2`): create an app at https://developer.atlassian.com/console/myapps, add the OAuth 2.0 (3LO) authorization type, and set its callback URL to the redirect URI shown on Executor's connect page. Enter the app's client id and secret there. Add the same granular Confluence API scopes in the console (Permissions > Confluence API) as are requested: read, write and delete for pages, folders, comments, attachments, custom content, databases, embeds and whiteboards, plus spaces, labels, tasks, users, content metadata and `read:configuration`/`read:space.permission`. The app-data scopes (`read:app-data`, `write:app-data`) are requested too. Admin-level `write:configuration` and `write:space.permission` are not requested.

## Known gaps

- OAuth tokens only work through the Atlassian gateway (`api.atlassian.com/ex/confluence/{cloudId}/wiki/api/v2`), so every tool on an OAuth account takes a required `cloudId` path parameter. Get it from `https://api.atlassian.com/oauth/token/accessible-resources` (it is also the account's external id, first site). API token accounts have no such parameter.
- On API token accounts 4 operations are skipped: the app-data operations (2 needing `read:app-data`, 2 needing `write:app-data`), which the spec declares as OAuth-only. They are available on OAuth accounts.
- No CQL search in v2 (see above); content labels search, user lookup by CQL and audit logs exist only in the v1 API (`/wiki/rest/api`), which is not included. Page bodies are read/written in storage or ADF formats.
- Confluence Data Center / Server is not covered.
