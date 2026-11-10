# OnlySocial

OnlySocial social media management (workspaces, connected social accounts,
posts, scheduling and queue, tags and the media library) through OnlySocial's
official remote MCP server, `https://app.onlysocial.io/os/mcp` (documented at
<https://api.onlysocial.io/doc-2269235.md>). It documents 24 tools, listed in
<https://api.onlysocial.io/doc-2269247.md>; the live list needs credentials, so
the count here is not verified. Read-only tools run freely; every other tool
asks for approval.

Auth:

- Access token (`apiKey`): in the OnlySocial dashboard open Access Tokens from
  the user menu, click Create, and paste the token (shown once). Sent as
  `Authorization: Bearer`. Write tools need the Member or Admin role in the
  workspace.
- OAuth (`oauth`): the server publishes RFC 8414 metadata, supports dynamic
  client registration and PKCE, scope `mcp:use`. No OAuth app needs to be
  created; add the Executor redirect URI if asked.

Known gaps: OnlySocial also has a REST API (<https://api.onlysocial.io/>) with
users, receipts, workspace management and subscriptions endpoints, and group
management. It publishes no OpenAPI document (docs only), so those are not
covered. Media upload by file is not in the MCP server (upload is by URL).
