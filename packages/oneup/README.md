# OneUp

Schedule and publish social media posts, manage comments and inbox conversations, and read analytics across the accounts connected to a OneUp (oneupapp.io) workspace.

## Interface

OneUp's official remote MCP server, `https://feed.oneupapp.io/mcp/oneup` (Streamable HTTP). OneUp publishes no OpenAPI document; its REST API (`https://www.oneupapp.io/api/`, docs at https://docs.oneupapp.io) is documented only as prose pages, and the vendor states the MCP connector supports all core API features: connections and categories, text/image/video posts, scheduled/published/failed/draft posts, comments, inbox, WhatsApp and analytics. Tools are listed live from the server (50 at the last check, 33 read-only and 17 not; the count may change). Tools without a read-only hint require approval.

## Auth

- OAuth: the server publishes OAuth metadata with dynamic client registration and PKCE (scope `mcp:use`). The user creates no OAuth app and there is no redirect URI to register: the client is registered dynamically on connect. OneUp's sign-in page asks the user to paste their API key and approve access.
- API key: create it at https://www.oneupapp.io/api-access. It is sent as the `apiKey` query parameter of the MCP URL, as OneUp documents.

## Known gaps

- Comments and analytics may need the Intermediate, Growth or Business OneUp plan. Unverified: no vendor page reachable confirmed it.
- The server answers anonymous `initialize` and `tools/list`, but `tools/call` requires OAuth or an API key. The health check therefore calls the read-only `list-categories-tool` instead of using the generic MCP check.
