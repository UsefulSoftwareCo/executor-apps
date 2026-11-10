# OpenWeb Ninja

Real-time web data from [OpenWeb Ninja](https://www.openwebninja.com): Google search, AI Overviews and AI mode, news, images, maps and local business data, Waze, jobs (JSearch, Glassdoor, salaries), Amazon, Walmart, eBay, Costco, Wayfair and Home Depot products, Zillow and Redfin listings, finance, events, books, contact and email enrichment, Trustpilot, Yelp, unofficial ChatGPT/Gemini/Copilot relays (the vendor labels these three unofficial) and a web unblocker. 225 operations across about 50 APIs.

## Interface

OpenAPI, compiled from `openapi.json` in this package. It is derived from the vendor's official OpenAPI document, linked as "OpenAPI" from its public catalog at [agents.openwebninja.com/llms.txt](https://agents.openwebninja.com/llms.txt) (`https://agents.openwebninja.com/zcj/d3fkaq9pdppw/openapi.json`, 226 GET/POST operations, of which one, the storefront's own `/zeroclick/agent/quote` seller-quote POST, is dropped as it is not part of the data API). Changes made to it: servers set to `https://api.openwebninja.com`, operation paths kept as-is, the agent plan/payment surface (`planAccess` bearer, `x-payment-info`, `x-zeroclick-*`, the 401/403 plan responses) removed, and security set to the `x-api-key` header. The `agents.openwebninja.com` server is not used, because its auth is an agent plan/payment bearer rather than a user API key. Requests go to `https://api.openwebninja.com/<api>/<operation>`. Each call consumes plan quota.

The previous version of this package was built from the operation manifest of the vendor's MIT-licensed [OpenWeb-Ninja/openwebninja-mcp](https://github.com/OpenWeb-Ninja/openwebninja-mcp) (181 operations). The current document covers 179 of those and adds 46 operations (including the two renamed routes below) (Real-Time Bing Search, Bing Jobs, Indeed, LinkedIn, Monster, ZipRecruiter, Local Business Database, Google Maps Traffic Alerts, extra Product Search and Web Search routes). The other two manifest operations, `/jsearch/search` and `/realtime-product-search/v2/product-price-history`, appear in the current document only as `/jsearch/search-v2` (cursor pagination instead of `page`) and `/realtime-product-search/v2/product-price-history-v2` (adds `page`); they are the same operations renamed, so the superseded routes are not exposed. Gateway probes without a key return 401 for both the old and the v2 routes and for the newly added prefixes (for example `realtime-bing-search-data`), and 403 for unknown prefixes, which suggests `api.openwebninja.com` routes them, but this was not confirmed with a real key.

## Auth

API key only. Sign in at [app.openwebninja.com](https://app.openwebninja.com) and copy your API key; it is sent as the `x-api-key` header and is the same key for every API. Calls to an API generally need an active plan for it (the vendor's pages mention a free tier on some APIs). The connection health check reads `GET /usage?api_id=jsearch`, which is not documented by the vendor and whose response was never verified with a real key; it also depends on the key having JSearch access, so a valid key without JSearch may fail the check. There is no OAuth.

## Known gaps

- The 11 POST operations (ChatGPT, Gemini, Copilot, Web Unblocker and similar) are treated as mutations and require approval. ChatGPT, Gemini and Copilot are labelled unofficial relays by the vendor.
- The vendor's MCP manifest omits the Real-Time Bing Search, Real-Time Bing Jobs, Real-Time Indeed, Real-Time LinkedIn, Real-Time Monster, Real-Time ZipRecruiter, Local Business Database and Google Maps Traffic Alerts APIs (and some Product Search and Web Search routes); they come only from the vendor's OpenAPI document and are unverified against a real key.
- The `/usage` quota endpoint is not exposed as a tool, and the health check on it is unverified (see Auth).
- Responses follow the vendor document's schemas, which were not checked against live responses.
