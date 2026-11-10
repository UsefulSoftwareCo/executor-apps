# Common Room

Common Room contacts, organizations, activities, segments, tags and notes:
query, create and update go-to-market data from agents.

Interface: Common Room's official remote MCP server (streamable HTTP),
`https://mcp.commonroom.io/mcp`, documented at
https://www.commonroom.io/docs/using-common-room/mcp-server/. It lists five
tools (`commonroom_get_catalog`, `commonroom_list_objects`,
`commonroom_create_object`, `commonroom_update_object`,
`commonroom_submit_feedback`); listing needs credentials, so the count is not
verified here. This package also covers the catalog target "Common Room MCP".
Common Room has REST APIs (Core v1, v2, SCIM) but publishes no OpenAPI
document, so the MCP server is the interface.

Auth:

- OAuth (`oauth`): the server publishes OAuth metadata (authorization server
  `https://login.commonroom.io/`, scopes `openid profile email offline_access`)
  with dynamic client registration, so Executor registers its own client; no
  manual OAuth app is needed. The redirect URI is shown on the connect page.
  Each token belongs to one user and follows that user's workspace permissions.
  A Common Room admin can disable MCP access under Settings > MCP Server.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: no API-key method for the MCP server. Account health only verifies
the token reaches the MCP server. The icon is the diamond mark from the
favicon SVG published on commonroom.io.
