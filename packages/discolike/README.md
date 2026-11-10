# DiscoLike

Covers the DiscoLike B2B company discovery and enrichment API: lookalike and ICP-based discovery, counts, match and bulk match, firmographic append, bizdata, growth, scoring, vendors, subsidiaries, contacts, email finding, DiscoGen, saved queries, CRM connections and LLM/search provider settings.

Interface: OpenAPI, from DiscoLike's official document at https://api.discolike.com/v1/openapi.json (docs: https://docs.discolike.com). The document declares no servers, so paths are mounted under https://api.discolike.com/v1.

Auth: API key only. Create one in your DiscoLike account (sign up at https://www.discolike.com, then create a key under API keys). It is sent in the `x-discolike-key` header, as the docs specify (the published OpenAPI names the header `X-API-Key`; the package overrides it). DiscoLike also accepts OAuth bearer tokens, but these are minted by its CLI login, not by a user-created OAuth app, so they are not offered.

Known gaps: the API key health check reads `/usage`. Mutations (including task cancel, signup and integration changes) require approval. Async jobs (bulk match, segment, email batch, DiscoGen) are polled through the `status` and `cancel` task endpoints.
