# Gumroad

Products, variants, offer codes, custom fields, sales, refunds, license keys, subscribers, payouts, emails, upsells, UTM links, pages and webhook subscriptions on Gumroad.

**Interface:** hand-written tools over Gumroad's REST API v2 (`https://api.gumroad.com/v2`). Gumroad publishes no OpenAPI document, and its remote MCP server (`https://gumroad.com/claude/v1/mcp`, OAuth with dynamic registration) was not inspected (it needs OAuth, so tools/list was not retrieved); its advertised scopes suggest a narrow surface. Endpoints were taken from the API reference at https://gumroad.com/api and the routes in https://github.com/antiwork/gumroad. Create and update tools take a `body` object with the fields Gumroad documents; list tools take a `query` object.

**Auth**
- Access token: in Gumroad, open Settings > Advanced > Applications, create an application, and click "Generate access token". The token is sent as a bearer token.
- OAuth: use the same Applications page to create an app and give its client ID and secret to the connect page. Set the app's redirect URI to the one Executor shows. Requested scopes: view_profile, edit_profile, edit_products, edit_emails, view_sales, edit_sales, mark_sales_as_shipped, view_payouts.

Every mutation requires approval.

**Known gaps:** file uploads (presign/complete), media, covers, thumbnails, custom HTML editing, workflows' email editing and marketing actions are not exposed. Earnings and tax forms need the view_tax_data scope, which the OAuth connection requests; a token must carry it too. Tools were checked by typecheck and deploy only; no real account was called.
