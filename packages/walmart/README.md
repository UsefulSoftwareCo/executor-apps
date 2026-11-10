# Walmart Marketplace

The Walmart Marketplace seller APIs: create and manage items, inventory, prices and promotions, read and acknowledge/ship/cancel/refund orders, handle returns, run Walmart Fulfillment Services (WFS) inbound and inventory, upload bulk feeds, request reports, manage shipping and fulfillment settings, subscribe to notifications, read Insights and assortment recommendations, reviews, disputes, claims, payments and Ship with Walmart.

**Interface:** OpenAPI. Walmart publishes each Marketplace API as its own official OpenAPI 3.0 document on its developer portal (https://developer.walmart.com, a ReadMe site); the documents are fetched from the portal's registry (`https://dash.readme.com/api/v1/api-registry/<id>`, ids listed in `openapi.ts`). All share one origin, `https://marketplace.walmartapis.com`, and each is mounted under its own key in one router (203 tools): `items`, `inventory`, `prices`, `promotions`, `orders`, `returns`, `fulfillment`, `feeds`, `reports`, `settings`, `simplifiedShipping`, `notifications`, `insights`, `assortmentRecommendations`, `recommendations`, `disputes`, `claims`, `lagTime`, `reviews`, `shipWithWalmart`, `utilities`, `payments`, `paymentReports`. Every non-GET operation asks for approval.

**Auth:** Client ID and client secret. Create them in Seller Center under Settings, API Key Management (https://seller.walmart.com), or in the Developer Portal for solution providers. The package exchanges them at `POST /v3/token` (client credentials, Basic auth) and sends the 15-minute token as `WM_SEC.ACCESS_TOKEN`, with `WM_SVC.NAME` and a generated `WM_QOS.CORRELATION_ID`, on every request.

**Known gaps:**
- Walmart's OAuth flow for solution providers (seller-authorized access via `login.account.wal-mart.com`) renames the standard authorize parameters (`clientId`, `redirectUri`, `responseType`), which Executor's OAuth cannot express, so only the client-credentials method is offered.
- Operations whose documented path embeds a query string (for example `/v3/feeds?feedType=PRICE_AND_PROMOTION`) are skipped by the generator: 3 in `prices`, 1 in `promotions` and 2 in `paymentReports`. The same feeds are reachable through the `feeds` upload operation with the `feedType` parameter.
- Advertising (a separate host and auth), the sandbox origin and the Canada, Mexico and Chile marketplaces are not covered.
- Marketplace API access requires an approved Walmart seller or solution provider account.
