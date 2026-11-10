# Plain

Plain is a support platform for B2B teams. This package exposes Plain's whole GraphQL API (threads, customers, companies, tenants, labels, tiers, help center, events and more) as tools; every mutation requires approval.

## Interface

Plain's official GraphQL API at `https://core-api.uk.plain.com/graphql/v1` (schema: `https://core-api.uk.plain.com/graphql/v1/schema.graphql`, listed on integrations.sh). Tools are generated from the schema by introspection, which needs a valid key. Plain also runs a remote MCP server at `https://mcp.plain.com/mcp`; the GraphQL API covers more operations, so it was chosen.

## Auth

- API key: in Plain, open Settings, Machine Users, create a machine user, then "Add API key" and choose its permissions. Sent as `Authorization: Bearer plainApiKey_...`. The key is shown once. A call without the needed permission fails with an error naming it.
- OAuth: not offered. Plain documents machine-user API keys for the GraphQL API; its OAuth belongs to the MCP server.

## Gaps

- Plain's GraphQL API is hosted in one region (UK host) for all workspaces.
- Webhooks and Plain's event subscriptions are not covered.
- Not verified against a live workspace (no real credentials used).
