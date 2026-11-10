# lc.cx

Create, list, update and delete short links (singly or in bulk), manage branded domains and tags, read workspaces, get click statistics for links and tags, and generate QR codes in lc.cx. The service is now branded Nemorius (lc.cx is its short-link domain); it is the same account and API.

Interface: hand-written tools (25) over lc.cx's REST API, `https://api.lc.cx/v1`. lc.cx publishes no OpenAPI document; its official reference is a Postman-published documentation site at https://dev.lc.cx, and the tools mirror the endpoints listed there (account, domains, links, shorten, tags, workspaces, statistics, qr). The docs list `api.nemorius.com` in the request URLs and `api.lc.cx` in the response examples; both serve the same API, and this package uses `api.lc.cx`. Create and update operations accept the documented fields (bulk QR accepts either a template or title and color); mutations require approval. A check for an official Nemorius/lc.cx MCP server was not completed; none is known.

Auth:
- API key: in lc.cx go to Account, then API Key, then Create API Key (https://lc.cx/en/help/how-do-i-create-api-key). The key is sent in the `apikey` request header. Only `api.lc.cx` receives it.
- No OAuth: lc.cx documents no OAuth for third-party apps.

Health: `GET /v1/account` (read-only). The unauthenticated response is 401, confirmed live; the authenticated response shape comes from the docs and was not run with a real key.

Known gaps: the optional `workspace` request header (links, shorten, tags, statistics, QR) is not sent, so only the account's default workspace can be targeted; the API reference has no schema for the `rule` field of `shorten` (smart-link rules), so it is passed through as a string; QR code and statistics responses are returned as raw JSON. Some domain options (homepage, 404 page) are plan-restricted. The icon is Nemorius's own mark (264px PNG from the vendor site).
