# OneSimpleAPI

Covers OneSimpleAPI's utility API toolkit: screenshots, web page to PDF, QR codes, URL shortener and unshortener, web page info (meta tags, Open Graph) and status/certificate, email validation, exchange rates, image info and image manager (CDN transforms), color palettes, readability and sentiment, PPP discount calculator, Spotify artist profiles and the JSON cache. 16 tools.

**Interface:** hand-written tools over the vendor's HTTP API (`https://onesimpleapi.com/api/<endpoint>`). OneSimpleAPI publishes no OpenAPI document, MCP server or GraphQL API, so the tools follow the endpoint docs at https://onesimpleapi.com/docs. Every call asks for `output=json`.

**Auth:** API token only (`apiKey`). The vendor has no OAuth. Create a token at https://onesimpleapi.com/user/api-tokens and enable the features (permissions) you want on it; an endpoint whose feature is disabled on the token is rejected. **The token must have the Exchange Rate feature enabled to connect**: OneSimpleAPI has no account endpoint, so the connection check is a read-only exchange_rate call. An invalid token is answered with a redirect to the login page (not a 401), which the check reports as a rejected token. The token is sent as the `token` query parameter, which is how the vendor defines it.

**Approvals:** only the URL shortener (a mutation) requires approval. Screenshot, PDF, image manager and QR code tools are plain queries even though they create hosted CDN assets that count against the account's quota.

**Stale docs:** the vendor's llms.txt lists hyphenated paths such as `/api/exchange-rate`, `/api/qr-code` and `/api/page-info`; those return 404. The live paths use underscores (`exchange_rate`, `qr_code`, `page_info`), which is what the tools call.

**Gaps:** the CSV and plain-text output modes and the redirect modes are not exposed; the tools return JSON only. Image, PDF, screenshot and QR tools return the hosted asset URL rather than the bytes. The vendor's Google Sheets helper output is not covered. The icon is the vendor's official 512px app icon (https://onesimpleapi.com/img/onesimpleapi.png).
