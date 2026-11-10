# Stay AI

Manage Shopify subscriptions in Stay AI: subscriptions and their lines, customers, orders, product catalog, selling plan groups, webhooks and data exports (24 tools).

Interface: hand-written tools over Stay AI's public REST API (`https://api.retextion.com/api/v2`). Stay AI publishes no single OpenAPI document, only one per operation page embedded in https://docs.stay.ai/reference (index: https://docs.stay.ai/llms.txt), so `operations.ts` lists the operations from those pages. Each tool takes path parameters by name, `query` for GET filters and `body` for the JSON request body. Every non-GET tool needs approval.

Auth: API key only (no OAuth). Create one in the Stay merchant portal under Settings -> API Keys, choosing the scopes it needs (Read/Update/Delete Subscriptions, Read Orders, webhook scopes, Read Selling Plan Groups, or All). Executor sends it in the `X-RETEXTION-ACCESS-TOKEN` header.

Known gaps: the docs' request-body schemas for creating subscriptions, selling plan groups and webhooks are not modeled, so bodies are free-form JSON. `orders.list` documents its filters as a request body on a GET; the tool sends them as query parameters, which may be ignored by the server. Webhook delivery verification (JWT) is not covered.
