# osu!

Users, beatmaps, beatmapsets, scores, rankings, multiplayer matches, chat, forum, news and notifications from the osu! API v2.

**Interface:** OpenAPI, the official osu!web description at https://osu.ppy.sh/docs/openapi.yaml (120 tools, 48 of them mutations, each requiring approval).

**Auth:** OAuth 2.0 only; osu! has no personal access tokens. Create an OAuth application in osu! account settings (https://osu.ppy.sh/home/account/edit, "OAuth"), set its callback URL to the redirect URI shown on Executor's connect page, then enter the client ID and secret. Requested scopes: `identify public friends.read forum.write`. The `chat.*` and `delegate` scopes are not requested because osu! restricts them.

**Known gaps:** Some operations in the published description declare no response schemas, so results are untyped. Chat tools need extra scopes osu! grants only to approved clients.
