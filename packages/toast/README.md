# Toast

Toast restaurant point-of-sale. Covers 48 operations across seven of Toast's official APIs, mounted under their own keys: `orders` (orders v2, checks, payments, selections), `menus` (menus v2), `labor` (employees, jobs, shifts, time entries, break types), `restaurants` (restaurant and group info), `cashManagement` (cash entries and deposits) `partners` (partner access to restaurants) and `stock` (inventory status for menu items and modifiers).

## Interface

OpenAPI. Toast publishes official Swagger 2.0 documents at `https://doc.toasttab.com/toast-api-specifications/` (for example `toast-orders-api.yaml`). They declare the placeholder host `toast-api-server`, so the app pins each account's own origin, `https://<subdomain>.toasttab.com`. Mutations ask for approval. Almost every operation takes the `Toast-Restaurant-External-ID` header (the restaurant GUID) as a tool input.

## Auth

API client credentials: the client ID and client secret Toast issues for an API integration (Toast Web, Integrations, Toast API access; production credentials come from the Toast integrations team), plus the API subdomain: `ws-api` for production or `ws-sandbox-api` for the sandbox. The app exchanges them at `/authentication/v1/authentication/login` (`userAccessType: TOAST_MACHINE_CLIENT`) and sends the token as a bearer header. This is not a standard OAuth token endpoint, so no OAuth redirect is involved. Which operations work depends on the scopes granted to the client.

## Known gaps

Toast does not publish downloadable documents for Menus V3, Configuration, Kitchen, Device Details, Credit Cards, Packaging, Analytics or Order Management Configuration (their spec URLs return 403), so those APIs are not included.

The operation count is per mounted document (orders 16, menus 2, labor 21, restaurants 2, cashManagement 2, partners 2, stock 3); every document is compiled at runtime. The Stock API is an OpenAPI 3 document whose server path is `/stock` and whose paths start with `/v1`, so it is mounted at `/stock` (requests go to `/stock/v1/inventory`).
