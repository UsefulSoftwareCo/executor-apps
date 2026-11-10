# Slack

Channels, messages, threads, users, files, reactions, pins, reminders, user groups, search and the rest of the Slack Web API (171 tools, 108 of them mutations; every mutation asks for approval).

**Interface:** OpenAPI. Source is Slack's official Swagger 2.0 description (version 1.7.0), `https://raw.githubusercontent.com/slackapi/slack-api-specs/master/web-api/slack_web_openapi_v2.json`, published by the `slackapi` GitHub organisation on `master` (not pinned to a commit). The document is patched at load time and is not Slack's verbatim file: 19 schemas whose `items` is an array (invalid Swagger 2 tuple form) are replaced with a plain object schema, which otherwise causes core methods such as `chat.postMessage` and `conversations.list` to be skipped. The patches are in `openapi.ts`.

**Approvals:** Slack declares many side-effecting methods as GET (`views.open`, `views.publish`, `apps.uninstall`, `auth.revoke`, `dialog.open`, `files.remote.share`, `workflows.*` and others). These are forced to mutations with `kinds` so they ask for approval. Some read-only POST methods are also treated as mutations and so ask for approval; this is safe but noisy. The `oauth.access`, `oauth.token` and `oauth.v2.access` methods are removed because they take `client_secret` as a query parameter. Slack's official remote MCP server (`https://mcp.slack.com/mcp`) was probed but needs a directory-published or internal Slack app, so it is not usable for arbitrary users.

**Auth**

- Token: a bot token (`xoxb-`) or user token (`xoxp-`) from your Slack app's "OAuth & Permissions" page at https://api.slack.com/apps. User tokens are needed for methods such as `search.messages`.
- OAuth: create a Slack app at https://api.slack.com/apps, add the redirect URI shown on Executor's connect page under "OAuth & Permissions", and enter its client ID and secret. The flow requests bot scopes (comma separated) and yields a bot token; reduce the scopes to what the app needs. Every requested scope was checked against its docs.slack.dev scope page as a bot scope; `mpim:write` is user-token only and is not requested.

**Known gaps**

- No operations are skipped after the patches (171 of the 174 spec operations are exposed; the 3 removed are the oauth.* methods above).
- OAuth yields a bot token only; user-token-only methods (search, some admin methods) need the token method.
- File uploads via the legacy multipart `files.upload` are not supported.
- Icon is Slack's hash mark from the Slack website (`a.slack-edge.com`), as Simple Icons has no Slack entry.
