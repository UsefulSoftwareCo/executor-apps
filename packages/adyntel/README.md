# Adyntel

Competitor ad intelligence from [Adyntel](https://adyntel.com): ads from the Meta (Facebook and Instagram), Google, Google Shopping, LinkedIn and TikTok ad libraries by company domain or keyword, TikTok ad details, and paid versus organic keywords for a domain. 11 tools.

## Interface

Hand-written tools over `fetch` against `https://api.adyntel.com`. Adyntel documents its endpoints at <https://docs.adyntel.com> (see <https://docs.adyntel.com/llms.txt>). It publishes OpenAPI 3.0.3 JSON fragments on one docs page, <https://docs.adyntel.com/openapi-docs/existing-endpoints.md>, covering 10 paths (`/facebook`, `/facebook_ad_search`, `/google`, `/google_shopping`, `/google_shopping_status`, `/linkedin`, `/linkedin-keyword-search`, `/tiktok_search`, `/tiktok_ad_details`, `/domain-keywords`). There is no single spec document, and `/tiktok` is missing, so no OpenAPI import was possible and every endpoint is written by hand from the vendor docs.

Adyntel also has an official MCP server (<https://mcp.adyntel.com/sse>, docs at <https://docs.adyntel.com/integrations/adyntel-mcp-server.md>), which was not used. It exposes only 3 tools (`search_facebook_ads`, `search_google_ads`, `search_linkedin_ads`), so it covers 3 of the 11 operations here and lacks TikTok, Google Shopping, keyword search and the domain keywords endpoint. It also uses the SSE transport with credentials in the URL or `X-Adyntel-*` headers.

Every endpoint is a POST that only reads data, so all tools are queries. Most calls spend Adyntel credits (usually 1 per page); `googleShoppingStatus` is free per the vendor docs. `googleShoppingAds`, `metaAds` with `webhook_url` or `all_ads`, and `googleAds` with `all_ads` start paid background scrapes; their tool descriptions say so. A 204 response from Adyntel can mean no ads were found, an unreachable site, no Facebook URL, or a non-public page; the tools return `{ results: [], reason }` listing these possibilities.

## Auth

API key plus account email, entered together as one account. Both are sent in the JSON body of each request (`api_key`, `email`), as Adyntel requires. Find the key in your Adyntel profile under Integrations at <https://app.adyntel.com>; the email is your Adyntel login email. There is no OAuth.

The health check calls `/google_shopping_status` with a placeholder job id, which looks up a job rather than scraping or charging.

## Gaps

- Optional filters (country_code, media_type, date_filter, continuation tokens and so on) go in a `params` object on tools that take many options.
- Webhook-based jobs (`webhook_url`, `all_ads`) are accepted via `params` but results are delivered to your URL, not returned.
- The icon is a hand-redrawn SVG of the Adyntel mark from <https://adyntel.com/images/logo-no-background.png>; Adyntel publishes no vector logo.
- `tiktokAdDetails` takes the ad id as a string, matching the vendor's example. This was not checked against a live response.
