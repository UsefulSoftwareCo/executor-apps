# Exa

AI-focused web search for agents: neural and keyword search, find pages similar to a URL, fetch page contents, get answers with citations, and manage monitors, agent runs, batches and websets (searches, enrichments, items, imports, webhooks and events).

**Interface:** OpenAPI plus two hand-written tools. Exa's own "Exa Public API" 2.0.0 document, https://api.exa.ai/openapi.json (also published at https://exa.ai/docs/exa-spec.yaml), served against https://api.exa.ai. 60 tools are generated live from it. `POST /search` and `POST /answer` are typed as server-sent-event responses in the document, which the generator drops silently (as it does `POST /agent/runs` and `GET /agent/runs/{id}/events`), so `custom.search` and `custom.answer` call those two endpoints with `stream: false` and return plain JSON. Generated tools live under `api.*`, the custom ones under `custom.*`. Every mutation (POST, PUT, DELETE, PATCH) asks for approval, which includes search, contents and answer because Exa models them as POST and they spend credits.

**Auth:** API key. Create one in the Exa dashboard at https://dashboard.exa.ai/api-keys; it is sent in the `x-api-key` header (Exa also accepts it as a Bearer token). Exa has no OAuth for user-created apps, so no OAuth method is offered.

**Icon:** the "E" mark from Exa's official logo (https://exa.ai/images/logo/exa-logo-blue.svg, linked from https://exa.ai/brand), cropped from the wordmark. Simple Icons has no Exa entry.

**Known gaps:** Streaming agent runs (`POST /agent/runs`, `GET /agent/runs/{id}/events`) are not exposed. Exa also publishes a public, unauthenticated remote MCP server at https://mcp.exa.ai/mcp (web_search_exa and web_fetch_exa); it is not used because the OpenAPI document covers far more. The health check reads `GET /v0/teams/me` and checks only the response status.
