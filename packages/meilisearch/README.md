# Meilisearch

Indexes, documents, search (including facet and multi-search), index settings, tasks, batches, API keys, snapshots, dumps, webhooks and experimental features of a Meilisearch instance, on Meilisearch Cloud or self-hosted.

**Interface:** OpenAPI. Uses Meilisearch's official document from https://raw.githubusercontent.com/meilisearch/open-api/main/open-api.json (maintained by Meilisearch; it tracks a recent release, so an older or newer instance may lack or add operations). The document's server is relative, so calls go to the instance URL stored on the account.

**Auth:** API key. Enter the instance URL (Meilisearch Cloud: shown on the project page, like `https://ms-1a2b3c4d5e6f.meilisearch.io`; self-hosted: your own URL, http or https, sub-paths allowed) and an API key, sent as `Authorization: Bearer <key>`. Create a key via Meilisearch Cloud project settings or `POST /keys` on your instance. Prefer a scoped key over the master key; operations outside the key's actions fail with 403.

**Host pinning:** the provider declares no `hosts` because instance domains are arbitrary and the framework only accepts static host lists. The key reaches app code as a raw value; tool calls are restricted to the account's own instance origin (`allowedOrigin`).

**Gaps:** no OAuth (Meilisearch has none). Every POST, including search, is treated as a mutation and asks for approval.
