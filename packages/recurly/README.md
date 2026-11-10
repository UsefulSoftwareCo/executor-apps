# Recurly

Subscription billing with Recurly: accounts, billing info, plans, add-ons, subscriptions, invoices, transactions, coupons, items, and related resources of the V3 API (version `v2021-02-25`).

**Interface:** OpenAPI. Recurly publishes the V3 definition in its official client repository, https://raw.githubusercontent.com/recurly/recurly-client-node/4.82.0/openapi/api.yaml. The URL is pinned to the 4.82.0 release tag, so the tool set changes only when this package is updated. Every request is sent with `Accept: application/vnd.recurly.v2021-02-25+json`, which the API requires.

**Auth:** a private API key, sent as the HTTP Basic username with an empty password. Create one under Integrations > API Credentials in Recurly (https://app.recurly.com/go/developer/api_keys). Pick "US data center" (`v3.recurly.com`) or "EU data center" (`v3.eu.recurly.com`) to match where your site is hosted. Only API-key authentication is offered; Recurly's V3 API documents private API keys as its authentication method, and no user-created OAuth app flow was found.

**Notes:** tools that take a `site_id` accept a site ID or `subdomain-<name>`. Mutations always ask for approval. The older XML V2 API is not covered. The Purchases operations (`createPurchase`, `previewPurchase`, `createPendingPurchase`, `createAuthorizePurchase`) are included through a patch: the spec's `PurchaseCreate.transaction` object uses a JSON-pointer `$ref` form the compiler rejects, so its options are redefined in `openapi.ts` with the same fields.
