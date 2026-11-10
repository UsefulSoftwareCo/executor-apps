# Scrape.do

Scrape any web page through Scrape.do's rotating proxies, anti-bot bypass and headless browser, read structured data from its ready scraper APIs (Amazon, Google Search, Maps, Shopping, Flights, Hotels, News, Trends, Play Store, YouTube, Walmart, Home Depot, Lowe's, ChatGPT, Gemini), and run async batch jobs.

**Interface:** custom, hand-written tools (45) over Scrape.do's documented HTTP API at `https://api.scrape.do` and its Async API at `https://q.scrape.do/api/v1`. Scrape.do publishes no OpenAPI document, GraphQL schema or MCP server, so the tools follow https://scrape.do/documentation/ (see https://scrape.do/llms-docs.txt). Each structured endpoint takes its main parameters by name plus a `params` object for any other documented query parameter.

**Auth:** API token (`apiKey`). Copy it from the Scrape.do dashboard (https://dashboard.scrape.do) after signing up; Scrape.do offers a free account. The token goes in the `token` query parameter of `api.scrape.do` and in the `X-Token` header of `q.scrape.do`. Scrape.do offers no OAuth. The account check calls `/info`, which Scrape.do limits to 10 requests per minute.

**Approvals:** `scrapeWithBody` (non-GET requests to a target site), `async.createJob` and `async.cancelJob` ask first. Every call spends credits; `super`, `render` and the Google endpoints cost more than a plain request.

**Known gaps:** `scrape` returns the response body as text or parsed JSON; binary downloads and screenshot images arrive as returned by Scrape.do (JSON when `screenShot` is used with `returnJSON`). The Lowe's `POST /plugin/lowes/store` cart variant and the deprecated `callback` parameter are not exposed. Google News topic and section navigation uses the same `news` tool through `params`.
