# Winston AI

Detect AI-generated text and images, check plagiarism, fact-check claims and compare two texts with the Winston AI API (v1 and v2 endpoints).

**Interface:** OpenAPI, Winston's own document at https://docs.gowinston.ai/api-reference/openapi.json (9 operations, all POST, all treated as mutations and approval-gated since each one spends credits). Winston also runs a remote MCP server at https://api.gowinston.ai/mcp/v1 (OAuth 2.1 or API key); it is not mounted because the OpenAPI document already covers the public API.

**Auth:** API key (`apiKey`), sent as a Bearer token to `api.gowinston.ai`. Create it in the Winston developer dashboard at https://dev.gowinston.ai. The API has no OAuth for user-created apps.

**Icon:** Winston publishes only a wordmark SVG; the icon is the "W" app icon PNG (270px) from gowinston.ai.

**Known gaps:** no read-only or account endpoint exists in Winston's OpenAPI document, MCP tool list or docs (every operation is a billable POST), so the provider has no `health` check. A bad key is only detected on the first tool call, where Winston answers 401 or 403 (an unauthenticated request returned 403 when tested). Advanced image detection costs 500 credits per run and fact checking 2 credits per word.
