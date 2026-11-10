# Asana

Tasks, projects, sections, portfolios, goals, teams, users, custom fields, webhooks, time tracking and the rest of Asana's REST API (251 tools, 132 of them mutations that require approval).

**Interface:** OpenAPI, Asana's official document at https://raw.githubusercontent.com/Asana/openapi/cd062f4e6c367f5b84f369a8c824e36bbe836ca5/defs/asana_oas.yaml (maintained in the Asana/openapi repository; pinned to commit `cd062f4`, so upstream changes need a deliberate bump). Server: `https://app.asana.com/api/1.0`.

**Auth**

- Personal access token: create one in the Asana developer console (https://app.asana.com/0/my-apps) under Personal access tokens.
- OAuth 2.0: create an app in the same developer console, copy its client ID and secret into the connect page, and add Executor's redirect URI to the app's redirect URLs. Requests the `default` scope, which Asana defines as Full permissions. Set the app to Full permissions under OAuth > Permission Scopes in the developer console; an app registered with granular scopes is refused. Asana issues refresh tokens by default.

**Known gaps:** Asana's separate remote MCP server (`https://mcp.asana.com/v2/mcp`) and SCIM API are not covered. Both OpenAPI auth methods send a bearer token; Service Accounts use the token method.
