# Heyzine

Turns PDFs and office documents into interactive flipbooks and manages them:
convert from a URL or attachment, list and inspect flipbooks, update design,
delete, set social share metadata, organise bookshelves, configure password
access lists, and fetch oEmbed data.

Interface: Heyzine's official remote MCP server (streamable HTTP),
`https://heyzine.com/mcp`, documented at https://heyzine.com/developers. It
lists 17 tools (convert attached/URL/async, list/details/update/delete
flipbook, flipbook and bookshelf social, bookshelf list/add/remove, access
setup/add/remove, oEmbed). Listing needs credentials, so the count comes from
the docs, not a live call. Heyzine's REST API (`/api1/...`) publishes no
OpenAPI document, and the MCP tools run the same code as the REST API.

Auth:

- API key (`apiKey`): sent as `Authorization: Bearer <key>` to the MCP endpoint.
  Shown on https://heyzine.com/developers after login.
- OAuth (`oauth`): the server publishes OAuth metadata (OAuth 2.1, PKCE S256,
  scope `mcp`) and dynamic client registration, so Executor registers its own
  client; no manual OAuth app is needed. The redirect URI is shown on the
  connect page. The OAuth token works only on the MCP endpoint.

Approvals: every tool the server does not mark read-only asks for approval, and
the 12 known mutating tools (convert, update design, delete, social, bookshelf
add/remove, access setup/add/remove) always ask whatever the server's hints say.

Known gaps: account health only verifies the credentials reach the MCP server.
Bookshelf tools need a Heyzine plan with bookshelves. The icon is Heyzine's own
vector app mark (favicon.svg on heyzine.com, a 32 viewBox SVG); Heyzine
publishes no brand or press page, so this is the vendor's only official mark.
Heyzine's MCP server is the source of truth.
