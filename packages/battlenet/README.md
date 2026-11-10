# Battle.net

Blizzard's Battle.net APIs: World of Warcraft game data (items, spells, creatures, classes, mounts, professions, journal), public character profiles, guilds, realms, auction house and WoW Token price, Mythic+ and PvP leaderboards, Diablo III heroes and seasons, StarCraft II profiles and ladders, and Hearthstone cards, decks and metadata, plus a read-only raw GET for any other path.

Interface: hand-written read-only tools over the official REST API at `https://{us,eu,kr,tw}.api.blizzard.com` (https://community.developer.battle.net/documentation). Blizzard publishes no OpenAPI document and no remote MCP server. Every tool takes an optional `region` (default `us`) and `locale`.

Auth:

- Client credentials (`apiKey`): create a client at https://develop.battle.net/access/clients and paste the client ID and secret. The package fetches app tokens from `https://oauth.battle.net/token`. Covers game data and public profiles.
- OAuth (`oauth`): use the same client's ID and secret. Add the redirect URI shown on the connect page to the client's Redirect URLs (Blizzard requires https). Scopes `openid wow.profile sc2.profile d3.profile` add the signed-in player's own WoW account profile, protected character data, collections and StarCraft II profiles.

Known gaps: all tools are read-only (the API has no write endpoints). The China region (`gateway.battlenet.com.cn`, `oauth.battlenet.com.cn`) is not supported. The raw `request.get` tool only reaches the four global regions. WoW Classic namespaces are reachable only through `request.get`.
