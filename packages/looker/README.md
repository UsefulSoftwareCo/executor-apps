# Looker

Covers the Looker API 4.0 for an instance: Looks, dashboards, queries, LookML models and explores, projects and Git, users, groups, roles, scheduled plans, connections, content, themes and the rest of the admin API, 494 tools in all (259 mutations, each requiring approval).

Interface: OpenAPI 3.0, the official Looker API 4.0 document published by Google at https://raw.githubusercontent.com/looker-open-source/sdk-codegen/main/spec/Looker.4.0.oas.json. Its server is a placeholder, so each account's own instance is used as the base URL (`https://<host>/api/4.0`) and credentials are only ever sent to that origin. Looker also offers a managed MCP server at `/api/internal/mcp` on each instance; it is not mounted because the REST API is a superset.

Auth: one method, API client credentials. Enter the instance hostname (for example `mycompany.cloud.looker.com`), the Client ID and the Client Secret. In Looker, open Admin > Users, edit the user and create an API key under API Keys. Executor exchanges them at `POST /api/4.0/login` for an access token (sent as `Authorization: token ...`) and renews it as it expires. This is done in code rather than with the framework's `oauth2` method because the token endpoint lives on the customer's own instance and Looker's OAuth flow requires registering the OAuth client through the Looker API first, so it is not offered. Calls act as the key's user, so access follows that user's roles and permission sets.

Credentials are limited by the provider's `hosts` to `*.looker.com`, `*.cloud.looker.com` and `*.looker.app`; the account check calls `GET /api/4.0/user`.

Known gaps: self-hosted Looker on a custom domain or non-standard port is not supported, and the managed MCP server is not mounted.
