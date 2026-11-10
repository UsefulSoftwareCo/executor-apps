# Giphy

Search and fetch GIFs and stickers from GIPHY: search, trending, translate, random, lookups by ID, categories, tag autocomplete and related tags, trending searches, channel search, random customer IDs and emoji (18 read-only tools).

Interface: the GIPHY HTTP API at `https://api.giphy.com`. GIPHY publishes no OpenAPI document of its own (the APIs.guru conversion is a community spec with only 10 operations), so `openapi.ts` is a hand-written OpenAPI document built from the official endpoint reference at https://developers.giphy.com/docs/api/endpoint/.

Auth: API key. Create an app at https://developers.giphy.com/dashboard/ to get one; it is sent as the `api_key` query parameter. Beta keys are rate limited (and capped at 50 results per search); apply for a production key in the dashboard to lift limits. There is no OAuth.

Known gaps:
- Upload (`POST upload.giphy.com/v1/gifs`, multipart) is not exposed.
- The analytics pingback URLs (`giphy-analytics.giphy.com`) are not exposed.
- GIPHY asks that search and trending are called from the end user's client; calling them server-side from an agent is outside that guidance for production apps.

Errors: GIPHY returns real HTTP status codes alongside its `meta` envelope (a bad or missing key gives HTTP 401 with `meta.status` 401), so failures surface as tool errors. The health check calls `/v1/gifs/trending?limit=1` (the `randomid` endpoint accepts any key) and also requires `meta.status` 200. The key travels in the query string as GIPHY requires; the framework's status errors carry only the HTTP status, not the URL.
