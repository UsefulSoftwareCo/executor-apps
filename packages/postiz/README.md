# Postiz

Schedule and publish social media posts through Postiz: list channels, create, schedule, move and delete posts, upload media, read platform and post analytics, notifications, find posting slots and run video clippings.

**Interface:** OpenAPI. Postiz's official Public API document, https://docs.postiz.com/public-api/openapi.json (28 tools, 0 skipped). The "Postiz MCP" catalog target is the same product; the official MCP server (`https://mcp.postiz.com/mcp/<api-key>`) embeds the key in the URL path, so it is not mounted here and the OpenAPI covers a superset.

**Auth**
- API key: in Postiz open Settings, Developers and copy the key. It is sent as the raw `Authorization` header value.
- OAuth: create an OAuth app in Settings, Developers, Apps (name and redirect URL; client id starts `pca_`, secret `pcs_`) and enter that client on the connect page. Use the redirect URI Executor shows when registering the app. Postiz OAuth has no scopes and tokens (`pos_...`) do not expire.

**Known gaps**
- Postiz Cloud only (`api.postiz.com`). Self-hosted instances use their own domain and are not supported.
- Rate limits: the vendor docs (https://docs.postiz.com/public-api/introduction) say 100 requests per hour on Cloud (90 self-hosted), applying only to the create-post endpoint, and each call counts as one request, so batch several posts into one request. The OpenAPI intro separately says "30 requests per hour"; the docs page does not confirm that, so treat it as an unverified, possibly stale figure. Exceeding the limit returns 429.
- The health check reads `GET /me`, documented to return the workspace (`organization` id and name) the credentials act on for both API keys and OAuth tokens; `user` is null for API keys. Not verified live without a connected account.
- File upload (`/upload`) is multipart; use `upload-from-url` for media where possible.
