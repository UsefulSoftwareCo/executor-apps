# Postscript

Manage a Postscript (SMS marketing for Shopify stores) shop: list, fetch and update subscribers, opt subscribers out, redact them for privacy requests, and send custom events that trigger flows.

**Interface:** hand-written tools over the documented Postscript API v2 (`https://api.postscript.io/api/v2`, reference at https://developers.postscript.io/reference). Postscript publishes no downloadable OpenAPI document and no remote MCP server; its docs only embed one OpenAPI fragment per endpoint, so the six documented endpoints plus `GET /me` are wrapped directly: `me`, `listSubscribers`, `getSubscriber`, `updateSubscriber`, `unsubscribe`, `redact`, `createCustomEvent`. Mutations require approval.

**Auth:** private API key (`Authorization: Bearer sk_...`). Find it in the Postscript app under Account > API at https://app.postscript.io/account/api. Use the private key, not the public one. Postscript has no user-created OAuth apps.

**Icon:** the P speech-bubble mark taken from the Postscript logo SVG on postscript.io (the mark is not in Simple Icons), cropped from the wordmark.

**Known gaps:** only the endpoints in Postscript's public reference are covered (no campaigns, keywords or message sending, which are not documented). Partner-only features (the `X-Postscript-Shop-Token` header for acting on behalf of a shop, triggers and webhook subscription management) are not exposed.
