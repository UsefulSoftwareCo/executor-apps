# Zyte API

Web scraping through Zyte API, which handles bans, proxies and browser rendering. Fifteen tools over `POST /v1/extract`: `browserHtml` (rendered HTML), `httpResponse` (raw HTTP fetch, body decoded), `screenshot`, AI extraction of `product`, `productList`, `productNavigation`, `article`, `articleList`, `articleNavigation`, `forumThread`, `jobPosting`, `jobPostingNavigation`, `pageContent` and `serp`, plus two approval-gated mutations: `request` (POST/PUT/PATCH/DELETE to the target site) and `extract` (any raw extraction request body, for browser actions, sessions, network capture, cookies and custom attributes).

Interface: hand-written tools over the official Zyte API (https://docs.zyte.com/zyte-api/usage/reference.html). Zyte documents the API with an OpenAPI 3.0 schema embedded in that page but publishes no standalone spec URL, so no OpenAPI document is used.

Auth: API key (`apiKey`), sent as the HTTP Basic username with an empty password. Copy it from https://app.zyte.com/o/zyte-api/api-access. Zyte API has no OAuth. The connection check sends an empty request body, which is rejected with 400 without being billed once the key authenticates; a 401 fails the check.

Known gaps: the separate Stats API (`zyte-api-stats.zyte.com`) uses a different dashboard API key and is not included. Each extraction request is billed per Zyte's pricing. Proxy mode is not applicable.
