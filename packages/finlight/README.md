# Finlight

Search Finlight's financial news (with sentiment, tickers, countries and categories), fetch a single article by its link and list the supported news sources.

**Interface:** hand-written tools over Finlight's REST API v2 (`https://api.finlight.me/v2`: `POST /articles`, `GET /articles/by-link`, `GET /sources`). Finlight publishes no OpenAPI document; the tools follow https://docs.finlight.me/en/v2/rest-endpoints/. Finlight also runs an official MCP server (`https://mcp.finlight.me`) that exposes the same three tools, so REST was used instead.

**Auth:** API key, sent as the `X-API-KEY` header. Create one in the Finlight dashboard at https://app.finlight.me. Finlight's MCP server also offers OAuth, but that only wraps the same key entry, and the REST API has no OAuth.

**Known gaps:** WebSocket streaming and webhooks are not tools. Entity and full-content fields depend on the plan. All tools are read-only.

The icon is Finlight's official app icon (apple-icon.png from finlight.me); the vendor publishes no usable standalone SVG mark.
