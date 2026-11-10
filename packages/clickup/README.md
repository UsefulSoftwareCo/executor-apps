# ClickUp

Tasks, lists, folders, spaces, comments, checklists, custom fields, views, tags, webhooks and the rest of the ClickUp API v2 (137 tools, 86 of them mutations that require approval).

**Interface:** OpenAPI, ClickUp's official document at https://developer.clickup.com/openapi/clickup-api-v2-reference.json. Server: `https://api.clickup.com/api`.

**Auth**

- Personal API token: in ClickUp, open Settings, Apps, and generate an API token (`pk_...`). It is sent as the raw `Authorization` header value.
- OAuth 2.0: create an app under Settings, Apps, Create new app (https://developer.clickup.com/docs/authentication); copy its client ID and secret into the connect page and set the app's redirect URL to Executor's redirect URI. ClickUp has no scopes and its access tokens do not expire, so there is no refresh token. The token request is sent as JSON; the access token is sent as `Authorization: Bearer ...`.

**Known gaps and notes**

- The document refers to many schemas by JSON-pointer paths into other operations, which Executor's compiler does not accept. `openapi.ts` replaces those schemas (mostly response bodies) with an open schema, so the affected tools return untyped JSON. `POST /v2/comment/{comment_id}/reply` has its request body written out by hand.
- `POST /v2/oauth/token` (OAuth code exchange) is intentionally not exposed as a tool; Executor performs that exchange itself.
- The ClickUp API v3 is not covered: Docs (docs and pages), Chat (channels, messages, reactions, replies), attachments, ACLs, audit logs and comment subtypes exist only in v3 (35 operations, https://developer.clickup.com/openapi/ClickUp_PUBLIC_API_V3.yaml). Only the v2 document is a source.
- ClickUp's separate remote MCP server (`https://mcp.clickup.com/mcp`) is not covered.
