# Orgo

Orgo provides cloud computers (Linux and Windows desktops) that AI agents can create and control. This package exposes 72 tools: computers (create, start, stop, restart, clone, fork, resize, move), workspaces, screenshots, mouse and keyboard actions, shell and exec, files, screens, templates and builds, secrets sync, and account capacity and sub-account management.

Interface: OpenAPI, from Orgo's official spec at https://docs.orgo.ai/api-reference/openapi.json (API base https://www.orgo.ai/api). The spec declares 74 operations; the compiler yields 72 tools. The other two operations are text/event-stream endpoints that the compiler leaves out without counting them as skipped: `streamBuildEvents` (GET /templates/{namespace}/{name}/{version}/build/events) and `createChatCompletion` (POST /v1/chat/completions, which can stream). Mutations require approval, as does `listWorkspaces`: it is a GET, but the vendor documents that it creates a first workspace for an account with none when called with an account-wide key.

Auth: API key only. Sign in at https://www.orgo.ai/start, then create a key under https://www.orgo.ai/settings/credentials (API keys). Keys must start with `sk_` (for example `sk_live_...`). Orgo also issues workspace-scoped keys, which can only reach the computer, workspace and file endpoints of one workspace; use an account-wide key for full coverage. Paste the key when connecting. It is sent as `Authorization: Bearer <key>` to www.orgo.ai. Orgo does not offer OAuth.

The connection health check calls the read-only GET /account/capacity, which needs an account-wide key (workspace-scoped keys get 403), so a workspace-scoped key will show as unhealthy.

Known gaps: the two streaming endpoints above are not exposed. Not tested with a live account.
