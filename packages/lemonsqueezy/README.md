# Lemon Squeezy

Stores, products, variants, prices, orders, subscriptions (and invoices, items, usage records), customers, discounts, license keys, checkouts, webhooks and affiliates.

**Interface:** 57 hand-written tools over Lemon Squeezy's official REST API at https://api.lemonsqueezy.com/v1 (docs: https://docs.lemonsqueezy.com/api). Lemon Squeezy publishes no OpenAPI document, GraphQL API or MCP server, hence hand-written. Responses are JSON:API; filters (`filter[store_id]`), pagination (`page[number]`, `page[size]`) and `include` go in the `query` input, request documents in `body`. All POST/PATCH/DELETE tools require approval.

**Auth:** API key, created at https://app.lemonsqueezy.com/settings/api (test-mode keys reach test-mode data). Sent as `Authorization: Bearer <key>`. The health check calls `GET /v1/users/me`. Lemon Squeezy has no OAuth for third-party apps, so none is offered.

**Known gaps:** the License API (`/v1/licenses/activate|validate|deactivate`, unauthenticated, form-encoded, meant for end-user apps) is not included. Paths were written from the docs (users/me, order and subscription-invoice refund and generate-invoice, and customer update were re-checked against their docs pages) and not called live. github.com/lemonsqueezy has no public repositories, so there is no official OpenAPI document or MCP server.
