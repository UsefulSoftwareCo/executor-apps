# RedCircle API

Real-time Target.com data from Traject Data's RedCircle API: product details, search results, category listings, customer reviews and in-store stock, plus category lookup, account usage and zipcode management.

**Interface:** hand-written tools over the documented API (`https://api.redcircleapi.com`, docs at https://docs.trajectdata.com/redcircleapi). RedCircle publishes no OpenAPI document and no remote MCP server. The five data request types (`product`, `search`, `category`, `reviews`, `store_stock`) are one `GET /request` endpoint selected by `type`, so each is its own tool. Also wrapped: `categories` (`GET /categories`), `account` (`GET /account`) and `zipcodes.list` / `zipcodes.add` / `zipcodes.delete` (`/zipcodes`). Ten tools in total; the zipcode mutations require approval.

**Auth:** API key. Sign up at https://app.redcircleapi.com/signup and copy the key from the dashboard. RedCircle sends it as the `api_key` query parameter; there is no OAuth. The health check calls the free Account API and only checks for an HTTP success status.

**Icon:** the official RedCircle API wordmark from the vendor's docs (white PNG), placed on a solid red square so it is visible on light and dark backgrounds. RedCircle publishes no separate symbol and the product is not in Simple Icons.

**Known gaps:** the Collections, Destinations and Error Logs APIs are not wrapped, and CSV output (`output`, `csv_fields`) is not exposed (JSON only). Data requests consume credits (1 per page, 2 for a GTIN lookup with `skip_gtin_cache`).


**Verification:** every request type and parameter, the zipcodes methods, paths and body shape (`[{zipcode, domain}]`, 10 per page) and the categories parameters were checked against the vendor's rendered docs under https://docs.trajectdata.com/redcircleapi (the `.md` pages listed in https://docs.trajectdata.com/llms.txt). Credit costs are documented only for GTIN lookups (2 instead of 1) and the free Account API; other costs are not stated by the vendor and are not claimed here. The vendor's docs index and Product Updates page mention neither an OpenAPI document nor an MCP server, and a search for either found none (a final follow-up search was blocked by the search budget).
