# Web Scraper

Manage Web Scraper Cloud (webscraper.io): list, create, update and delete sitemaps, enable or disable their schedulers, start and delete scraping jobs, read job status, data quality and problematic URLs, and download scraped data as JSON, CSV or XLSX.

**Interface:** hand-written tools over the Web Scraper Cloud REST API (`https://api.webscraper.io/api/v1`, docs at https://webscraper.io/documentation/web-scraper-cloud/api). Web Scraper publishes no OpenAPI document and no remote MCP server, so the 18 operations used by the vendor's official API client (https://github.com/webscraperio/api-client-php) are wrapped directly. Mutations (create/update/delete sitemap, scheduler enable/disable, create/delete job) require approval.

**Auth:** API token. Copy it from the API page of your Web Scraper Cloud account at https://cloud.webscraper.io/api. It is sent as the `api_token` query parameter on every request, as the vendor's official client does (the vendor docs page is JavaScript-rendered and could not be read). The token only goes to api.webscraper.io. Responses with `success: false` are treated as errors. Web Scraper has no OAuth.

**Icon:** the official hexagon mark from https://webscraper.io/icon.svg.

**Known gaps:** scraping-job settings beyond `sitemap_id`, `start_urls` and `custom_id` (driver, delays, proxy, etc.) and scheduler settings were not confirmed against the rendered docs, so they are passed as free-form JSON (`options` / `config`) rather than typed. sitemap, scheduler and job configuration are passed as free-form JSON following the vendor's documented shapes, not validated here. Download tools return the whole file in the response, so very large jobs may be unwieldy; XLSX is returned as base64. Webhooks are configured only in the Cloud dashboard. The health check calls `GET /account`.
