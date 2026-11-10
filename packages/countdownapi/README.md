# Countdown API

Real-time eBay data from Countdown API (Traject Data): search results, product details, reviews, seller profiles and seller feedback, plus search-term autocomplete, and the free read-only account (usage) and destinations endpoints.

**Interface:** custom, hand-written tools (8). Six data tools use `GET https://api.countdownapi.com/request` with a `type` parameter per tool (each call consumes credits); `account` (`GET /account`) and `destinations` (`GET /destinations`) are free, read-only management endpoints. Traject Data publishes no OpenAPI document, GraphQL API or MCP server. Source: https://docs.trajectdata.com/countdownapi/ebay-product-data-api/overview

**Auth:** API key (`apiKey`). Sign up at https://app.countdownapi.com and copy the key from the dashboard. The key is sent as the `api_key` query parameter (the only method the API supports). There is no OAuth.

**Icon:** none. Countdown API has no product-specific mark (Traject Data's site only carries the Traject Data company logo, which is a parent-company logo and is not used), so `icon.ts` exports an empty list until the vendor publishes a mark.

**Health check:** `GET /account`, which is free; it decodes only `request_info.success`.

**Gaps:** The Collections API and its Destinations create/update/delete operations are not exposed (they are mutations and would need approvals), and neither are batch requests. Endpoints were not exercised with a live key.
