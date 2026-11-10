# v0

Covers v0 by Vercel through two interfaces, chosen by the auth method on the account.

API key account: the v0 Platform API v1 (beta), an OpenAPI 3.1 document published by v0 at https://api.v0.dev/v1/openapi.json (40 paths, single origin `api.v0.dev`, 59 operations, 58 exposed as tools). It covers chats and messages, code versions, projects, deployments and their logs, hooks, project environment variables, MCP server connections, and account, plan, billing and usage reports. The document declares an `Authorization` header apiKey scheme; the package sends the key as `Authorization: Bearer <key>`.

OAuth account: v0's official remote MCP server at https://v0.app/api/mcp, which v0 documents as having parity with the current v2 API except streaming operations and ZIP downloads. Authorization is discovered from https://v0.app (S256 PKCE, dynamic client registration), so there is no OAuth app to create. Tools are whatever the server lists; non-read-only tools require approval.

Why both: v0 now labels v2 (https://v0.app/docs/api/v2) as the current API and v1 as legacy, but publishes no public v2 OpenAPI document (api.v0.dev/v2/openapi.json and v0.app/api/v2/openapi.json both return 404). The v1 spec is the only official machine-readable REST description, so the API key path uses it as legacy-beta; the MCP path exposes current v2 operations.

Auth: API key, created at https://v0.app/settings/keys (the older /chat/settings/keys path redirects there). The REST API documents no OAuth; OAuth applies to the MCP server only. Mutations require approval.

Known gaps: the v1 platform API is legacy beta and its spec may change. `chats.resume` (POST /chats/{chatId}/messages/{messageId}/resume) returns `text/event-stream` and is not exposed as a tool; the generator drops it without reporting it as skipped, so the tool count is 58 of 59 operations. The OpenAI-compatible `/v1/chat/completions` model endpoint is not in the OpenAPI document and is not exposed. The MCP server omits streaming operations and ZIP downloads.
