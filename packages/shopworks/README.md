# ShopWorks

Read-only access to ShopWorks ManageOrders (the order system behind OnSite): orders, line items, payments, tracking numbers and inventory levels. 9 tools.

**Interface:** hand-written tools over ShopWorks' official ManageOrders API, described by its Swagger 2.0 document at https://app.swaggerhub.com/apis-docs/ShopWorks/ManageOrdersAPI/1.0.0 (base URL `https://manageordersapi.com/v1/manageorders`). The document is Swagger 2.0 with a sign-in step, not an OpenAPI 3 document with a static key, so the tools are written by hand. The package signs in with `POST /signin` and sends the returned `id_token` as the `Authorization` header, renewing it before it expires.

**Auth:** username and password for the ManageOrders API. ShopWorks grants these on request: email support@shopworx.com to sign up. There is no OAuth.

**Known gaps:** the API is read-only, so there are no mutation tools. Deployments that use a tenant-specific path (for example `/onsite`) are not supported; this package targets the documented `/v1` base URL.
