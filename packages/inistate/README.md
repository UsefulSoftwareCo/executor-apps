# Inistate

Query and change Inistate workspaces through Inistate's MCP server: read and write entries and design or modify modules (the server's default "configure" mode). Activities, history and file uploads belong to its "runtime" mode.

Interface: Inistate's official remote MCP server at `https://mcp.inistate.com/mcp` (docs: https://inistate.gitbook.io/home/mcp-integration/mcp). Inistate publishes no OpenAPI document for `api.inistate.com`, so MCP is the most complete official source. The server starts in its default "configure" mode, described in its docs as entry CRUD plus module design and schema tools; "runtime" mode (entry queries, activities, history, file uploads) and "frontend" mode are reached with its `switch_mode` tool. The docs say the tool surface updates immediately without reconnecting, but Executor builds its tool catalog when the account connects, so the runtime-only tools may not appear in Executor until the host re-lists tools; only the configure-mode tools are claimed here. The tool count was not measured, because listing tools needs an authenticated Inistate account (the unauthenticated probe returns 401).

Auth: OAuth 2.0 with dynamic client registration and PKCE, discovered from the server's metadata. Connecting signs in to your Inistate account; no key or OAuth app needs to be created. Executor's callback is registered through dynamic client registration, so you register nothing and no redirect URI must be configured; Inistate's docs say no custom URL setup is required. Requested scopes: entries, files and module schema read/write, plus `user:read`. The `webhooks:manage` scope is not requested. Inistate's docs describe only the account sign-in flow for the MCP endpoint and say nothing about REST API tokens; we have not verified that tokens are rejected, so no key method is offered here.

Approvals: every tool that does not declare `readOnlyHint` requires approval.

Known gaps: no direct REST tools (no public spec), and no webhook management.
