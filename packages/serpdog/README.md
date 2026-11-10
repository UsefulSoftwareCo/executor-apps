# Serpdog

Serpdog is a search-engine and web-data scraping API. This package exposes its documented endpoints as read-only tools: Google Search (advanced and lite), News, Images, Videos, Autocomplete, Shopping, Product, Finance, Scholar, Scholar author and Jobs; Google Maps search, reviews, photos and posts; Bing; YouTube; Yelp; Amazon search, product, reviews and autocomplete; Walmart product; LinkedIn Jobs; the generic web scraper; and account info (quota).

Interface: custom hand-written tools over Serpdog's REST API (`https://api.serpdog.io`). Serpdog publishes no OpenAPI document or MCP server; the endpoint list comes from https://docs.serpdog.io/llms.txt. Each tool takes the endpoint's required parameters as inputs and any other documented parameters (gl, hl, num, page, html, ...) in an optional `params` object.

Auth: API key only. Copy it from the Serpdog dashboard (https://api.serpdog.io/dashboard). Serpdog has no OAuth. The key is sent as the `api_key` query parameter.

Known gaps: Serpdog documents no Walmart search endpoint, so only Walmart product is exposed. Parameters are not validated beyond the required ones. Every call spends Serpdog credits. The JSON schema of responses is not typed.
