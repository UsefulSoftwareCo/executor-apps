# Squarespace

Orders, products and variants, inventory, contacts and address books, discounts, fulfillment options and transactions for a Squarespace commerce site, plus a site-info lookup (about 45 tools).

**Interface:** hand-written tools over the Commerce APIs at `https://api.squarespace.com`, following https://developers.squarespace.com/commerce-apis/overview. Squarespace publishes no OpenAPI document, GraphQL API or MCP server. Every request sends the mandatory `User-Agent` header.

**Auth**
- API key: in the site, Settings > Advanced > Developer API Keys > Generate Key (Commerce Advanced plan), choosing a permission per API. The key only reaches that one site.
- OAuth: create an app at https://account.squarespace.com/developer-apps and register the redirect URI the Executor connect page shows. Scopes: `website.orders`, `website.products`, `website.inventory`, `website.contacts`, `website.discounts`, `website.transactions.read`. Access tokens last 30 minutes and refresh tokens are single use; Executor handles refresh.

**Known gaps**
- Product image upload (multipart) is not exposed; image update, delete, reorder and status are.
- Webhook subscriptions (OAuth only), the Analytics API, Forms, and the maintenance-mode Profiles API are not covered.
- Create and update payloads for products, variants, discounts and imported orders are passed as free-form objects; the tool descriptions list the fields.
- Mutations require approval.
