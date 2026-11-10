# ScrapingAnt

Web scraping through ScrapingAnt's headless Chrome browsers and rotating datacenter or residential proxies, with CAPTCHA and Cloudflare bypass. Seven tools: `scrape` (raw HTML), `markdown` (LLM-ready markdown), `extended` (JSON with HTML, text, cookies, status code, headers, XHRs and iframes), `extract` (AI-powered structured extraction from a property description), `usage` (plan and remaining credits), and two approval-gated mutations, `scrapeWithJavaScript` (runs a snippet on the target page) and `scrapeWithBody` (POST/PUT/PATCH/DELETE to the target).

Interface: hand-written tools over the ScrapingAnt API v2 (https://docs.scrapingant.com). ScrapingAnt publishes an official OpenAPI document at https://api.scrapingant.com/openapi.json, but it only covers `/v2/general` and `/v2/usage`, repeats one operationId across five methods and omits `/v2/markdown`, `/v2/extended` and `/v2/extract`, so it is not used.

Auth: API token (`apiKey`), sent as the required `x-api-key` query parameter on every request (including the `/v2/usage` health check), so it travels in the URL query string, as the vendor docs and OpenAPI specify. Copy it from the dashboard at https://app.scrapingant.com. ScrapingAnt has no OAuth.

`scrapeWithBody` sends the target's content type as the `Ant-Content-Type` header, which ScrapingAnt strips of its `Ant-` prefix and forwards; a plain `Content-Type` header is not forwarded. `method` is validated to POST, PUT, PATCH or DELETE.

Unverified: the health check requires `plan_name` in the `/v2/usage` response because the docs sample shows it, but the docs do not promise it. No live API call was made (no credentials). The vendor docs and OpenAPI show no endpoints beyond general, markdown, extended, extract and usage.

Known gaps: the target page's status code is only exposed where the API sends the `Ant-page-status-code` header (`/v2/general`); the `/v2/markdown` endpoint does not. Credits are spent on every successful scrape (see the cost note in each tool description).
