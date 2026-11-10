# SERPHouse

Real-time and batch search engine results from SERPHouse: Google (web, lite, news, images, shopping, local, place details, jobs, forums, videos, short videos, autocomplete, top-100), Bing (web, news, images), Yahoo (web, news, images), a generic live SERP endpoint, queued SERP tasks, a page scraper, and account, domain, language and location lookups. 29 tools.

## Interface

Hand-written tools over SERPHouse's REST API at `https://api.serphouse.com`. SERPHouse publishes no OpenAPI document, so the tools follow its official docs (https://www.serphouse.com/docs, full text at https://www.serphouse.com/docs/llms-full.txt). SERPHouse also hosts an official MCP server, but it authenticates by putting the API key in the URL path, which this app avoids: the key is sent as a Bearer header only.

## Auth

API key. Create one on the SERPHouse dashboard (https://www.serphouse.com) after confirming your email. It is sent as `Authorization: Bearer <key>`. SERPHouse offers no OAuth.

## Notes and gaps

- Search tools spend credits; scheduling tools (`tasks.schedule`, `google.scheduleTop100`) require approval. The `health` check calls `account/info` (reads plan and credit usage). Responses with HTTP 200 and `status: "error"` are raised as errors.
- The `/md` and `/html` response variants and the Google Trends endpoints (not in the public docs) are not exposed. The Rank Tracker is a separate product with no API in the docs.
