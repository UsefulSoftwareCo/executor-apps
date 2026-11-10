# Gift Up!

Sell and manage gift cards with [Gift Up!](https://giftup.com): gift cards (list, get, update, top up, redeem, redeem in full, undo redemption, void, reactivate, transfer balances), orders, items, item groups, locations, promotions, report transactions, settings, users and webhooks. 43 tools.

## Interface

Hand-written tools over the REST API at `https://api.giftup.app`, documented at <https://developer.giftup.com/api>. Gift Up publishes no OpenAPI, Swagger or Postman document and has no official MCP server or GraphQL API (the full docs page mentions none, and common spec URLs on developer.giftup.com and api.giftup.app return 404), so each operation is a `fetch` call. Every mutation requires approval.

## Auth

API key only (Gift Up has no OAuth). Create one in the Gift Up dashboard at <https://giftup.app/integrations/api-keys/> (the help article at <https://help.giftup.com/category/48-api> only points there). Gift Up does not document key scope or per-company behaviour, and gives no menu path. It is sent as `Authorization: Bearer <key>` to `api.giftup.app`. The health check reads `GET /company`.

## Test mode

Gift Up's `x-giftup-testmode: true` header switches an endpoint to test data; without it the call is live. Every tool whose endpoint the docs mark "Supports test mode" takes an optional `testMode` boolean that sends the header: all gift card tools, all order tools and both report transaction tools. Leave it unset and the call hits live data, including live money movement (top up, redeem, void, transfer) and live order creation, which is charged at Gift Up's fee. Pass `testMode: true` to use the built-in test environment. Company, items, groups, locations, promotions, settings, users and webhooks do not take the flag (webhooks have their own `isTestMode` field on subscribe).

## Known gaps

- `testMode` defaults to live; the agent must set it explicitly to target test data.
- Gift card update: the docs spell the recipient email patch path `/receipientemail` (likely a typo in the vendor docs). The tool documents that spelling; it is unverified against a live account because no credentialed calls were made.
- Not covered: Stripe connection get/update, inviting and deleting users, gift card artwork upload, `ping`, email and gift card settings updates.- Cross-checks: integrations.sh has no record.
