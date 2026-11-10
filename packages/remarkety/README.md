# Remarkety

Remarkety is an e-commerce email and SMS marketing platform (now part of Wingify). This package lists contacts and sends the events Remarkety uses to build customer, order, product, cart and newsletter data and to trigger automations.

## Interface

Hand-written tools over HTTP against the Event API at `https://webhooks.remarkety.com/webhooks/store/{storeId}`, documented at http://docs-api-v1.remarkety.com/ (Remarkety Event Reference): `sendEvent` plus typed wrappers for customers, orders, products, carts and newsletter consent. Requests are POSTs with `x-api-key`, `x-event-type`, `x-platform` and optional `x-event-time` headers.

## Auth

API key plus store ID. In Remarkety open Settings > API Keys, generate a token and copy the store ID shown on the same page. The key is sent as `x-api-key`. Remarkety offers no OAuth.

## Known gaps

Remarkety has no public OpenAPI document or MCP server. Its REST reference (api-docs.remarkety.com) is blocked to automated fetches (Cloudflare error 1014), so no REST read tools are included: the earlier customer list/get tools used endpoints that could not be confirmed. Because no documented read-only endpoint exists, the provider has no health check; a wrong key surfaces when an event is sent. Event payloads are passed as JSON and described in each tool, not validated. The icon is a "Re" crop of the vendor's wordmark PNG (https://s3.amazonaws.com/static.remarkety.com/media/images/remarkety_logo_2026_login.png) because no standalone mark is published.
