# Black Forest Labs

Generate and edit images and videos with the hosted FLUX models (FLUX.2, FLUX.1 Kontext, Pro/Ultra/Dev, fill, expand, video and editing tools), poll asynchronous results, manage fine-tunes and check credits.

- Interface: OpenAPI, the vendor's official document at https://api.bfl.ai/openapi.json (server `https://api.bfl.ai`).
- Auth: API key, sent as the `x-key` header. Keys belong to a project: in https://dashboard.bfl.ai open the project, then API -> Keys -> Add Key. A key is shown only once, so copy it when created. `get_result` has no security declared in the spec, so the package applies the key to it as well (the vendor's docs send `x-key` when polling).
- Mutations (all generation requests, which spend credits, and fine-tune deletion) require approval.
- Gaps: generation endpoints are asynchronous; call `get_result` with the returned id to fetch output. The REST API is API-key only. The vendor's separate FLUX MCP server (https://mcp.bfl.ai, Streamable HTTP) uses OAuth sign-in, but it exposes only about 7 tools and was not mounted because the OpenAPI covers all 29 operations. Results are polled at api.bfl.ai; regional hosts (api.eu.bfl.ai, api.us.bfl.ai) are not used.
