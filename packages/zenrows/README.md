# ZenRows

Scrape web pages with ZenRows: fetch (GET, POST, PUT) pages with JS rendering, premium proxies and anti-bot bypass, auto-extract structured data (`extract=auto`), and read plan usage.

**Interface:** OpenAPI 3.1, the vendor's own document at https://www.zenrows.com/openapi.json (listed in its RFC 9727 API catalog).

**Auth:** API key. Find or rotate it at https://app.zenrows.com/settings/api-keys (path per https://docs.zenrows.com/mcp/overview); sign up at https://app.zenrows.com/register. It is sent as the `apikey` query parameter for Fetch and as `X-API-Key` for the plan usage endpoint.

**Structure:** one product, one spec mounted twice. `api` (https://api.zenrows.com/v1): Fetch, Extract and plan usage. `batch` (https://async.api.zenrows.com/v1): jobs, tasks, results, exports, schedules, webhooks and HMAC keys (sent as `X-API-Key`).

**Known gaps:** the unauthenticated agent signup/account endpoints (`app.zenrows.com`) are not exposed. ZenRows also runs an official remote MCP server at https://mcp.zenrows.com/mcp (OAuth 2.1 or API key as Bearer; confirmed by probe, which returns a 401 OAuth challenge). Per https://docs.zenrows.com/mcp/overview it has about 50 tools: scrape, extract, account_usage, batch_*, and a large browser_* session set (navigate, click, screenshot, evaluate and so on). It is not mounted; the OpenAPI covers scrape, extract, usage and batch. The browser session tools are not available here.
