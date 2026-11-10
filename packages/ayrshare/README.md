# Ayrshare

Publish and schedule posts to 14+ social networks, validate posts, retry failures, read post history, analytics, comments and direct messages, upload media and manage profiles in Ayrshare: 33 tools, such as `create_post`, `retry_post`, `explain_error` and `get_platform_history`.

Interface: Ayrshare's official remote MCP server, `https://api.ayrshare.com/mcp` (https://www.ayrshare.com/docs/additional/mcp-action-connect). Ayrshare publishes no OpenAPI document (their site's `/docs/openapi.json` does not exist), so the MCP server is used. Tools are whatever the server lists for the account.

Auth:

- API key (`apiKey`): sent as `Authorization: Bearer <key>`. Create or copy it in the Ayrshare dashboard (https://app.ayrshare.com): switch to the Primary Profile, then open API Key in the left navigation. The server has no OAuth.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: the optional `Profile-Key` header and the X/Twitter OAuth 1.0a headers are not configurable; per-call `profileKey` tool arguments still select a profile, and a Business plan is needed for profiles. X/Twitter calls return error 419 without the OAuth 1.0a keys. Account health calls `GET https://api.ayrshare.com/api/user` with the key and checks that it returns a `refId`, so it verifies the key itself (the MCP server answers `initialize` and `tools/list` anonymously, which is why `mcpHealth` is not used). The `Profile-Key` and X/Twitter headers are left out on purpose: the secrets schema has no optional fields, so adding them would force every user to enter them.
