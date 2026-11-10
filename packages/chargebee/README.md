# Chargebee

Subscription billing in Chargebee: customers, subscriptions, invoices, credit notes, plans and items, coupons, payment sources, transactions, quotes, usage and more.

Interface: OpenAPI. Tools are generated from Chargebee's official OpenAPI 3.1 document for API v2 with Product Catalog 2.0, published at https://github.com/chargebee/openapi (`spec/chargebee_api_v2_pc_v2_spec.json`). Every mutation asks for approval. Chargebee's document lists templated per-site servers, so the package pins each account to its own `https://<site>.chargebee.com/api/v2`.

## Auth

API key. In Chargebee go to Settings > Configure Chargebee > API Keys and create a key (a full-access or custom-scoped key; tools the key cannot use return Chargebee's permission error). Enter the site name, the `<site>` of `<site>.chargebee.com` (use `<site>-test` for the test site), and the key. The key is sent as the HTTP Basic username with an empty password. Chargebee has no user-created OAuth apps for its REST API, so OAuth is not offered.

## Known gaps

- Sites still on Product Catalog 1.0 lack the Items-based endpoints, and the v2 document does not describe the Plans/Addons endpoints of that catalog (they are in `chargebee_api_v2_pc_v1_spec.json`).
- Chargebee also publishes MCP servers (data lookup, knowledge base, onboarding) per site; they are not mounted.
