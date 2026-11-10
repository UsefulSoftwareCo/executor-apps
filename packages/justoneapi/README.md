# Just One API

Metered access to public social media, creator, entertainment and ecommerce data: Xiaohongshu, Douyin, Kuaishou, Weibo, Bilibili, WeChat, Zhihu, Taobao and Tmall, TikTok, YouTube, Instagram, Amazon and many more platforms, plus cross-platform search.

**Interface:** OpenAPI 3.1, the vendor's own document at https://docs.justoneapi.com/openapi.json (303 paths, 286 GET and 17 POST), served from https://api.justoneapi.com. Vendor also runs an official remote MCP server (https://mcp.justoneapi.com/mcp) that wraps the same catalog behind a few generic search/call tools; the OpenAPI document gives one typed tool per endpoint, so it is used instead.

**Auth:** access token (`apiKey`). Create one in the dashboard at https://dashboard.justoneapi.com (new accounts get a few free calls). The API takes it as a `token` query parameter; this package injects it from the account and removes it from every tool's input schema. The published spec puts the token in the form body of POST endpoints (the WeChat and WeChat Channels ones); the vendor's usage guide says the token goes in the URL for every request, so it is sent in the query there too. No OAuth: the MCP server's OAuth is not used.

**Health check:** the OpenAPI document has no account or balance endpoint (the vendor's MCP docs mention an `mcp:account:read` scope, so one may exist outside the public spec). The check makes one billed lookup of a public Taobao item and requires code 0; codes 100 (bad token), 601 (no balance) and 602 (token budget exceeded) get specific messages. The vendor does not document whether the token or parameters are validated first, so a call without an itemId is not used.

**Notes and gaps:**
- Every call is billed against the account balance. Errors 601 (insufficient balance) and 602 (token budget exceeded) come back in the response `code`, with HTTP 200.
- POST endpoints are treated as mutations and need approval, although they are read-only searches; GET calls need none.
- The POST token-in-query behavior is inferred from the usage guide, not verified against a live account.
