# Live Tennis API

Real-time and historical tennis data from [Live Tennis API](https://livetennisapi.com): live matches and scores, points, statistics, market odds and prices, players, rankings, tournaments, head-to-head, the history archive, and webhook management.

Interface: OpenAPI, the vendor's official document at https://docs.livetennisapi.com/openapi.json (server `https://api.livetennisapi.com/api/public/v1`). Non-GET operations (webhook management) require approval.

Auth: API key only (the vendor has no OAuth). Create a key in your Live Tennis API account dashboard; keys start with `twjp_`. It is sent in the `X-API-Key` header. Some endpoints (history, odds, AI analysis, WebSocket tokens) depend on the plan tier of the key.

Known gaps: the WebSocket stream is not exposed as a tool; `/ws-token` only mints a token for it.
