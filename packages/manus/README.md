# Manus

Run and manage Manus AI agent work: tasks (create, send messages, list messages, confirm actions, stop, delete), projects, skills, agents, artifacts, files, webhooks, connectors, usage and credits, and websites built by Manus agents.

Interface: OpenAPI, using Manus's official v2 document at https://open.manus.ai/docs/v2/openapi_v2.json (API origin `https://api.manus.ai`). The legacy v1 API is not exposed.

Auth: API key or OAuth.

- API key: create one in the Manus web app under Settings, Developers (https://manus.im/app#settings/developers) and paste it in; it is sent in the `x-manus-api-key` header. This works for every operation.
- OAuth: Manus Open Apps (https://open.manus.ai/docs/v2/open-app). Any member of a Manus Team account can create a `team`-type Open App under Settings, Developers, Open Apps (https://manus.im/app#settings/developers/open-apps); personal accounts cannot create or authorize Open Apps. Register the client's redirect URI exactly as Executor shows it on the connect page (Manus requires an exact match), then enter the `client_id` and `client_secret` (shown once). Endpoints: authorize `https://manus.im/openapi/oauth`, token `https://api.manus.ai/oauth/token`, revoke `https://api.manus.ai/oauth/revoke`; client credentials are sent in the form body. Access tokens last 24 hours and refresh tokens 30 days. Configure the app's scopes in Manus (`create_task`, `manage_all_tasks`, `create_project`, `use_connectors`, `use_my_browsers`); adding scopes invalidates existing tokens. Tokens are sent as `Authorization: Bearer`.

The health check calls `user.me` (the `ok: true` envelope is checked).

Known gaps:

- OAuth with a standard `team` Open App cannot call `agent.*`, `webhook.create`, `webhook.list`, `webhook.delete` or `usage.*`; those need an API key (or a trusted team/public client token, which Team Owners/Admins or approved partners obtain). Other operations are limited by scope: `create_task` only sees tasks the app created, `project.detail` and `project.update` need `manage_all_tasks`, `browser.onlineList` needs `use_my_browsers`.
- File upload returns a presigned URL; uploading the bytes to it is not a tool.
- Interface choice: integrations.sh records an official remote MCP server at https://mcp.manus.im/mcp (OAuth). It was not probed or mounted; the full v2 OpenAPI (36 tools) was kept as the primary interface. Mounting the MCP server under an `mcp` key is possible future work if it adds capabilities.
