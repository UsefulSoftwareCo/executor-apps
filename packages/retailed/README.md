# Retailed

Sneaker, watch and retail product data from [Retailed](https://www.retailed.io): StockX, GOAT and Chrono24 search, product and price lookups, product pages on Best Buy, Nike, Dior, Farfetch, Forever21, Macy's, Stadium Goods, Uniqlo, Zalando and Zara, plus Retailed's own product, variant and price database and Shopify store search. 25 read-only tools.

**Interface:** hand-written tools over the REST API at `https://app.retailed.io/api/v1`. Retailed publishes no OpenAPI document or MCP server, so the tools follow the vendor docs ([docs.retailed.io](https://docs.retailed.io)). The full endpoint list with URLs is in [llms-full.txt](https://docs.retailed.io/llms-full.txt) (the `/llms.txt` index omits URLs): 19 of the 20 scraper tools are documented there as `GET https://app.retailed.io/api/v1/scraper/<site>/<operation>`. The exception is StockX product: the docs give `GET https://app.retailed.io/product` (no `/api/v1`, no scraper segment), while this package uses `scraper/stockx/product`. This conflict is unresolved without a key; an unauthenticated probe returned 404 for `/product` and 401 (route exists) for `/api/v1/scraper/stockx/product`, so the scraper path is used.

**Auth:** API key. Create one in the [Retailed dashboard](https://app.retailed.io/login) under **API Keys** > **New**. It is sent in the `x-api-key` header to `app.retailed.io`. The vendor docs document only API keys; no OAuth is documented. The health check calls `/api/v1/usage` (matches the usage page); its credit cost is not stated in the docs, so it is unverified whether it is free. The authentication page's curl example uses `/api/usage` without `v1`, an inconsistency in the vendor docs (probe: `/api/usage` returns 404).

**Known gaps:**
- The Chrono24 Finder attribute search (`GET https://piloterr.com/api/v2/finder/chrono24-search`, `query` parameter) is not exposed: it is served by piloterr.com, is not part of the Retailed API, and would add a second credential destination. Hosts are kept to `app.retailed.io`.
- Scraper calls spend API credits on your plan.
- Chrono24 search: `page` is documented as a body field on a GET and is sent as a query parameter (unverified). Price filters are not documented; `price_from`/`price_to` were removed.
