# Fluxguard

Fluxguard website change monitoring: add pages to monitor, trigger site crawls, read monitored page data, and manage webhooks, categories and sites (12 tools).

**Interface:** hand-written tools over Fluxguard's REST API at `https://api.fluxguard.com`. Fluxguard publishes no OpenAPI document and no MCP server; the endpoint list comes from its guide at https://fluxguard.com/how-to-guides/use-our-api/ (the API is labeled beta there).

**Auth:** API key only. Create it in Fluxguard under organization settings; it is sent in the `x-api-key` header. Fluxguard has no OAuth.

**Gaps:** the documented API has no endpoints to list sites or pages, read change history or edit page settings. Response shapes are not documented, so tools return raw JSON. Mutations (add, crawl, create, delete) require approval.
