# Shopware

Covers the Shopware 6 Admin API: products, orders, customers, categories, media, stock, promotions, shipping and payment methods, CMS, sales channels, plus generic entity search and the bulk sync endpoint, 1120 tools in all (787 mutations, each requiring approval).

Interface: OpenAPI, Shopware's official Admin API document at https://raw.githubusercontent.com/shopware/admin-api-reference/main/adminapi.json (every shop also serves it to admins at `/api/_info/openapi3.json`). The document's server is the relative `/api`, so each account's own shop origin is used as the base URL, and credentials are only ever sent to that origin. List and search tools take Shopware's criteria object.

Auth: one method, integration credentials (client credentials grant). In the Shopware Administration open Settings > System > Integrations, add an integration, and copy the Access key ID and Secret access key (the integration's ACL privileges set what the API may do). When connecting, enter the shop URL (for example `https://shop.example.com`), the access key ID and the secret. Executor exchanges them for a bearer token at `<shop URL>/api/oauth/token` and renews it as it expires. The grant is performed in code rather than with the framework's `oauth2` method because the token endpoint is on the shop's own host. The password and authorization-code grants the document also lists are not offered.

Known gaps: the Store API (storefront shopper operations) and plugin-specific schemas (Commercial, Custom Products, Digital Sales Rooms) are not included. Shop-specific custom entities are not in the published document. The icon is Simple Icons' Shopware mark.
