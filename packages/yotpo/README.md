# Yotpo

Manage a Yotpo store through the Core API: products, product variants, collections, orders, order fulfillments, customers, and webhook targets, filters and subscriptions (41 tools).

**Interface:** hand-written tools over the Yotpo Core API (`https://api.yotpo.com/core/v3/stores/{app_key}/...`), taken from the official reference at https://core-api.yotpo.com/reference. Yotpo publishes the OpenAPI definition only per page, not as one downloadable document, so the tools are written by hand from those pages. Every mutation requires approval.

**Auth:** API key. Enter your store App Key and API secret. Both are 40-character strings found in Yotpo under profile icon > Settings > General Settings (click "Get secret key" for the secret; Yotpo emails a verification code). The app exchanges them at `POST /core/v3/stores/{app_key}/access_tokens` for an access token sent as `X-Yotpo-Token`, and mints a new one when a call returns 401. Yotpo does not offer user-created OAuth apps for this API.

**Known gaps:** the UGC API (reviews, Q&A, visual UGC, privacy and insights endpoints) and the Loyalty and Subscriptions APIs use separate references and credentials and are not covered yet.
