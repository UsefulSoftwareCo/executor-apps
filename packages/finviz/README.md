# Finviz

Stock screener, price history, news and market group exports from Finviz Elite, returned as rows keyed by column name.

**Interface:** hand-written read-only tools over the Finviz Elite CSV export endpoints on `https://elite.finviz.com` (`/export`, `/quote_export.ashx`, `/news_export.ashx`, `/grp_export.ashx`). Finviz publishes no OpenAPI document, GraphQL API or MCP server, and its endpoint reference (the API and Exports page) is only readable when signed in to an Elite account. A paid Elite plan is required.

**Verification status:** the `auth` parameter name is confirmed by differential probes (a bogus `auth` returns 401 "Invalid export API token"; a missing auth or `token=` redirects to the Elite upsell HTML page). The path `/export` is the canonical screener export (`/export.ashx` 301s to it). The other three paths exist (they answer 401 for a bogus token, where nonexistent names 404), but their parameter names and defaults (`t`/`p`, `v`, `g`/`v`/`o`/`c`) come from public community usage and have not been confirmed against the signed-in docs or a real Elite key. The reported rate limit of 10 requests per 5 seconds (HTTP 429 with `Retry-After: 5`) is also unverified. Responses that are not CSV from `elite.finviz.com` are rejected, and the health check verifies the CSV header.

**Decisions:** a portfolio export tool was dropped because its parameters could not be confirmed. `https://finviz.com/api/v1/screener-export-csv` (linked from the site footer) was assessed and is not the Elite API: it is the website's own session-based "Export All Screener Data" call, returns `{"status":"success","data":[]}` for any request regardless of `auth`, and takes no key. Guessed names under `/api/v1/` for options, insider, calendar and filings all serve the HTML site, so no endpoint was found for options chain, calendar, insider, investor or SEC filings.

**Auth:** API key (`apiKey`). Elite members get a key in account settings under "API and Exports" (https://finviz.com/api-and-exports). It is sent as the `auth` query parameter to `elite.finviz.com` only. No OAuth.

**Known gaps:** no options chain, insider, investor holdings, calendar, SEC filings or portfolio tools. The health check is a one-ticker screener export because Finviz has no account endpoint. Results are cut to `maxRecords` (default 500, max 5000); check `truncated` and `totalRows`.
