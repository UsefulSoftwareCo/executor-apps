# Dungeon Fighter Online

Read-only access to Dungeon Fighter Online (global) game data through the Neople Open API: the server list, character search and details (stats, equipment, avatar, creature, oath, mist assimilation, skill style, buff setups), fame rankings, item and set item search and detail, item hashtags, jobs and skills.

## Interface

Hand-written tools over the Neople Open API, `https://api.dfoneople.com` (25 endpoints, one tool each), as documented at https://www.dfoneople.com/developers/contents/apiDocs. Neople publishes no OpenAPI document, GraphQL API or MCP server.

## Auth

API key. Register an application at https://www.dfoneople.com/developers (My Page, Applications) to get a key. It is sent as the `apikey` query parameter to `api.dfoneople.com`. There is no OAuth.

## Icon

Neople publishes no SVG or square app icon (dfoneople.com has no press or brand page). The icon is the game logo (title wordmark plus gear) from the game's Steam store assets, shown unchanged in light and dark themes.

## Known gaps

- Targets the global service only. The Korean service (`api.neople.co.kr`) has extra endpoints (timeline, auction, avatar market, flags) and requires a separate Korean developer key.
- Endpoints were written from the official docs and not called live.
