# Judge.me

Product and site reviews for Shopify and other storefronts: list, create, publish or hide reviews, reviewers, replies and private replies, review and storefront widgets, webhooks, and shop settings and info.

**Interface:** OpenAPI, Judge.me's official document at https://judge.me/api/docs.yaml (server `https://api.judge.me/api/v1`). 25 tools, 7 of them mutations (each needs approval). Two operations are skipped by the compiler (one unresolved schema reference, one unsupported path); the document also types `GET /shops/info` with a request body.

**Auth**

- API token (`apiKey`): the shop domain (for example `example.myshopify.com`) and a private API token, sent as the `X-Api-Token` header with `shop_domain` as a query parameter. Find both in Judge.me admin under Settings > Integrations > View API tokens. The private token grants read/write access; the public token only works for widget reads.
- OAuth 2.0 (`oauth`): create an app at https://judge.me/profile/apps/new (log in as a reviewer with the emailed magic link), set its redirect URI to the Executor OAuth callback URL shown on the connect page, and enter the Client ID and Secret there. Judge.me's token endpoint takes a JSON body and issues permanent tokens with no refresh token. OAuth tokens travel as `Authorization: Bearer` and identify the shop themselves. Judge.me reviews partner apps, so scopes may need approval.

**Known gaps:** `read_orders`, `write_orders`, `read_products` and `write_products` scopes exist, but the published API document has no orders or products operations beyond what appears in the tools; no health check beyond listing one review.
