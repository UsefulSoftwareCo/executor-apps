# eBay

Buy, Commerce, Developer and Sell REST APIs of eBay: item search (Browse), deals, feeds, catalog, taxonomy,
charity, translation, API usage analytics, and the seller side (account policies, order fulfillment and payment
disputes, listing, logistics, negotiation, recommendations, compliance, metadata, marketing, analytics, feeds).
About 200 tools, one router key per API.

## Interface

OpenAPI. The package compiles eBay's own OpenAPI 3 contracts, served at stable URLs of the form
`https://developer.ebay.com/api-docs/master/<domain>/<api>/openapi/3/<name>_oas3.json`, one router key per API
(28 mounts, 323 tools): Buy (browse, deal, feed, marketing, offer, order), Commerce (catalog, charity, identity,
media, notification, taxonomy, translation, vero), Developer (analytics) and Sell (account, analytics, feed,
finances, fulfillment, inventory, logistics, marketing, metadata, negotiation, recommendation, stores). Sell
Inventory (inventory items, offers, publish) is under `inventory`. Every contract declares an oauth2 scheme named
`api_auth`; the package replaces it with a bearer scheme so either credential below authorizes requests.
Mutations ask for approval.

## Auth

- OAuth client credentials (application token): create a keyset at https://developer.ebay.com/my/keys and
  enter the App ID (client ID) and Cert ID (client secret) on the connect page. Executor exchanges them at
  `https://api.ebay.com/identity/v1/oauth2/token` for the base `api_scope`, which is the only scope Browse search/get
  operations need (Browse bulk item operations need `buy.item.bulk`, and the Buy feed and Marketplace Insights
  style APIs need their own scopes granted to the keyset; those are not requested). It covers public data such as
  Browse, Taxonomy, Catalog and Deal. No redirect URI is needed.
- User access token (`token`): paste a user token generated in the developer console (Application Keys, "Get a
  Token from eBay via Your Application"). Needed for the seller APIs and anything acting on a user's account.
  These tokens expire after about two hours and are not refreshed.

Production only; the sandbox hosts are not supported.

## Known gaps

- eBay's authorization-code flow requires a RuName in the `redirect_uri` parameter instead of a URL. Executor
  reserves `redirect_uri` (it is not allowed in `authorizationParams`), so it cannot send a RuName; there is no
  user OAuth sign-in or token refresh, and `authorizationUrl` `auth.ebay.com` is deliberately not declared.
- The Compliance and Listing contracts, and Sell Account v2, have no file at the `developer.ebay.com` pattern
  (the URLs return an empty body), so they are not mounted rather than falling back to a third-party copy.
- Several contracts serve operations from more than one host. Payment dispute operations are served from
  `apiz.ebay.com` and mounted separately as `disputes`; the other Fulfillment operations are under `fulfillment`.
  Each mount skips the other's operations (`multiple_hosts`), as do 7 Media operations (apim.ebay.com vs the
  rest), 1 Buy Order and 1 Finances operation.
- Buy Order (guest checkout) needs eBay approval and a user token.
