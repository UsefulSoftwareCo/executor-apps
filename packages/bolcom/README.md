# bol.com

bol.com Retailer API v10 for marketplace sellers: orders and cancellations, shipments and shipping labels, returns, offers (price, stock, exports), inventory, products and assets, commissions, invoices, promotions, replenishments, transports, subscriptions and insights.

**Interface:** bol.com's official OpenAPI 3.0 document, https://api.bol.com/retailer/public/apispec/Retailer%20API%20-%20v10 (documented at https://developers.bol.com). The document declares no servers or security requirements, so `openapi.ts` patches in `https://api.bol.com` and a global bearer requirement. 69 tools, 27 of them mutations.

**Auth:** OAuth 2.0 client credentials (server to server; there is no redirect URI). In the bol.com Partner Platform open Settings > API settings, create client credentials, and paste the Client ID and Client Secret. Executor exchanges them at https://login.bol.com/token (HTTP Basic) for a bearer token. Mutations require approval.

**Known gaps:** only the production Retailer API is targeted, not the demo environment (`api.bol.com/retailer-demo`). The separate Advertising API (`api.bol.com/advertiser`) is not included. Some operations (exports, shipping labels) are asynchronous and return a process id.
