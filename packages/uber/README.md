# Uber

Covers the Uber Riders API (v1.2): product lists, price and time estimates, ride requests (estimate, create, get, update, cancel, map, receipt), trip history, the user profile, saved places and payment methods. 17 hand-written tools, because Uber publishes no OpenAPI document. Source: https://developer.uber.com/docs/riders/references/api. Mutations require approval.

## Auth

OAuth 2.0 only. Create an app at https://developer.uber.com/dashboard (a personal Uber account is required; organization accounts are not supported), then enter its client ID and secret on the connect page. Register the Executor redirect URI in the app's Auth settings. Authorization uses `https://auth.uber.com/oauth/v2/authorize` and token requests send client credentials in the body. Scopes requested: `profile history places offline_access request request_receipt`.

## Known gaps

- `request` and `request_receipt` are privileged scopes: they work only for the app owner and listed developers until Uber grants Full Access.
- Uber's older server tokens are deprecated and not offered.
- Other Uber surfaces (Eats Marketplace, Direct, Guest Rides, Vouchers, Business, Ads) need separate partner access and are not covered. Uber's cataloged MCP endpoint (mcp.uber.com) returned 403/404 to an unauthenticated probe and publishes no OAuth metadata, so it was not used.
