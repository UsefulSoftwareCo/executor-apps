# RAWG Video Games Database

Search the RAWG video game database: games (with additions, series, parent games, screenshots, stores, achievements, trailers, suggested games, development team, Reddit, Twitch and YouTube content), platforms, genres, stores, developers, publishers, creators, creator roles and tags. All 30 operations are read-only.

Interface: OpenAPI. RAWG's official Swagger 2.0 document at https://api.rawg.io/docs/?format=openapi is loaded live and converted by the framework. The document declares no security scheme, so `openapi.ts` declares the `key` query-parameter scheme and applies it to every operation.

Auth: API key only. Create a free key at https://rawg.io/apidocs; it is sent as the `key` query parameter to `api.rawg.io`. RAWG offers no OAuth.

Known gaps: the API has no write operations. RAWG's terms require attribution (a visible link to RAWG) when you display its data, and the free tier is rate limited.
