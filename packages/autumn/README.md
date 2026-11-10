# Autumn

Autumn is billing infrastructure for AI and SaaS products on top of Stripe. This package covers customers, plans, features, subscriptions and billing (attach, update, previews, portal), balances (check, track, lock), events, logs, invoices, entities, referrals, rewards, licenses, sandboxes and webhooks: 93 tools.

Interface: OpenAPI, from the OpenAPI 3.1 document Autumn maintains in its own repository and publishes in its docs, `https://raw.githubusercontent.com/useautumn/autumn/main/apps/docs/mintlify/api/openapi.yml` (API version 2.5.0, server `https://api.useautumn.com`). Autumn's official remote MCP server (`https://mcp.useautumn.com/mcp`) exists but is not used since the REST API is the larger surface.

Auth: API key. Create a secret key (`am_sk_test_...` or `am_sk_live_...`) in the Autumn dashboard under Developer > API Keys; it is sent as a Bearer token to `api.useautumn.com`. Autumn offers no user-created OAuth apps.

Known gaps: the API is RPC-style (every operation is a POST), so every tool is classified as a mutation and asks for approval, including reads such as `list` and `get`.
