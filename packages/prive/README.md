# Prive

Subscription management for Shopify stores with Prive (now branded Recurly Commerce): subscribers, subscriptions, subscription lines, upcoming orders, billing attempts, discount codes, products, cancellation surveys, memberships and webhooks.

**Interface:** hand-written tools over the REST API at `https://subs.api.tryprive.com/api/v1`, documented at https://developers.tryprive.com/reference. Prive publishes no downloadable OpenAPI document, so the tools follow the reference pages (endpoint list from https://developers.tryprive.com/llms.txt). Endpoints with large or unverified bodies (creating subscriptions, cadence, address, schedule updates) take a free-form `body` JSON object; the tool description links the reference page.

**Auth:** API key, sent as `Authorization: Bearer <key>`. Prive issues keys on request: email cs@tryprive.com or ask support from your Prive dashboard. There is no OAuth.

**Gaps:** list filters beyond those documented for subscriptions, subscribers and orders (for example `subscriptionId` on some list tools) are passed through and ignored by the API if unsupported. Product, activity and discount-code list endpoints were not fetched in detail. Mutations require approval.
