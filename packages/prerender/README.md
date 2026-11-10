# Prerender

Prerender.io tools: recache one or many URLs, search the cache, submit sitemaps, queue cache clears, check a clear job and set the recache queue speed.

**Interface:** custom, hand-written `fetch` tools (6) over Prerender's documented REST API at `https://api.prerender.io` ([docs](https://docs.prerender.io/docs/6-api)). Prerender publishes a Swagger page but no fetchable OpenAPI document, and the API takes the token in the JSON body (`prerenderToken`), which the OpenAPI auth mapping cannot express, so the tools are written by hand. The newer V3 API (https://api.prerender.io/v3/api, which redirects back to the same docs page) is not covered. No official Prerender MCP server or fetchable OpenAPI document (`/docs-json`, `/swagger.json`, `/openapi.json` and similar all return 404) was found; the docs page does not mention MCP, though a web search to confirm was not possible (search budget exhausted).

**Auth:** API token (`secrets`). Copy the Prerender token from the dashboard under Security and Access > Prerender Token (https://dashboard.prerender.io/security/prerender-token). Prerender offers no OAuth.

**Notes:** the HTTP method for `/search` is not stated in the docs; POST is inferred from behaviour (unauthenticated POST returns 400, GET returns 404). `recache` requires exactly one of `url` or `urls` (checked before sending). the account health check calls `/search` with an exact match for a URL that cannot exist, since the API has no read-only account endpoint. `/search` is limited to 50 requests per minute. Cache clear needs a current (non-legacy) plan. Response bodies are largely undocumented and returned as-is. Mutations require approval.
