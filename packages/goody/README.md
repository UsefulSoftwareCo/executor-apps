# Goody

Send gifts and physical products with Goody: browse the product catalog, brands and collections, price and create order batches, track and cancel orders, and manage gift templates, cards, payment methods and webhooks.

**Interface:** OpenAPI, from Goody's own published document at https://assets.ongoody.com/static/web/goody-api-openapi.json (linked from https://developer.ongoody.com/introduction/overview).

**Auth:** API key (bearer token). Create it in a Goody for Business account under Account > API Keys (https://www.ongoody.com/plus/account/api-keys). Adding a payment method on the same page is required to send gifts in production. Goody's API has no user-created OAuth apps for the Automation API, so OAuth is not offered.

**Key type:** The package expects an Automation API key (Account > API Keys). Goody also issues separate Commerce API keys (Organization > Commerce API, https://www.ongoody.com/plus/organization/api/commerce); both are sent as `Authorization: Bearer <key>` to the same host and `GET /v1/me` works with either, but Goody's docs do not say which operations a Commerce key may call, so only the Automation key is documented and tested here. `POST /v1/commerce_user_payment_methods` is a Commerce API endpoint and may require a Commerce key.

**Icon:** the 192px app icon from developer.ongoody.com (android-chrome-192x192.png). The published logo.svg is a small-glyph "goody API" wordmark, so it is not used.

**Notes and gaps:** The package targets production (`api.ongoody.com`). The sandbox (`api.sandbox.ongoody.com`) uses separate accounts and keys and is not wired in. Goody also publishes a remote MCP server, not used here: it exposes 28 tools, the same count as the 28 OpenAPI operations, but authenticates with OAuth (authorization code with PKCE and Dynamic Client Registration) or personal tokens scoped mcp.read/mcp.write/mcp.gifts, whereas the OpenAPI document uses plain API keys and is the stable public spec. All mutations (creating order batches, cancelling orders, webhooks) require approval.
