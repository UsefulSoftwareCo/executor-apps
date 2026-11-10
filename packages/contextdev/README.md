# Context.dev

Scrape, crawl, search and monitor websites, and retrieve brand, people and news data with Context.dev (46 tools, 21 of them mutations that require approval).

**Interface:** OpenAPI, Context.dev's official document at https://docs.context.dev/openapi.json (server `https://api.context.dev/v1`). The vendor also runs a hosted MCP server at `https://context-dev.stlmcp.com`; the OpenAPI document is preferred because it exposes the full API.

**Auth:** API key only. Sign up at https://context.dev/signup, copy a key from https://context.dev/dashboard/api-keys and paste it as the API key; it is sent as `Authorization: Bearer <key>`. The vendor documents only API-key authentication. Health check calls `GET /org/usage`.

**Approvals:** tools are classified by HTTP method, so POST-based read tools (scrape, search, answers, parse, news search, people enrich, brand retrieve and similar) also prompt for approval.

**Icon:** the Context.dev mark taken from the logo on https://docs.context.dev (mark only, wordmark removed).

**Known gaps:** none known; no operations are skipped.
