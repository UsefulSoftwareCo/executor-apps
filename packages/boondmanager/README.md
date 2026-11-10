# BoondManager

Tools for BoondManager, the ERP/CRM for IT services firms: candidates, resources, contacts, companies, opportunities, projects, orders, invoices, purchases, products, positionings, actions, contracts, deliveries, provider invoices, payments, agencies, poles, business units, time, expense and absence reports (including validate/reject/pay), reporting and billing balances, application dictionary and settings, and webhooks. 227 tools.

## Interface

Hand-written tools over the vendor's REST API (`https://ui.boondmanager.com/api`, JSON:API documents). Boond documents its API as RAML 0.8 (https://doc.boondmanager.com/api-externe/), not OpenAPI, and publishes no OpenAPI or MCP server, so each operation is declared from the official RAML. Lists take `page`, `maxResults`, `keywords`, `sort`, `order` and a `query` object for the other filters (list values are comma separated). Writes take `body`, a JSON:API document; each entity's `getDefault` returns the shape.

## Auth

- **OAuth 2.0** (authorization code): create an App in Boond under Developer space > Apps, enable OAuth2 on its Security tab, add the Executor redirect URI shown on the connect page, and note the client id and secret. Install the app and grant users access to it under rights management; its "Authorized APIs" field decides which endpoints it may call (Boond has no scopes).
- **Client token and key**: the `X-Jwt-Client-BoondManager` scheme. Needs the client token and client key (administrator interface > dashboard) and a user token (user settings > security). Executor signs a fresh HS256 token for each request.
- **Login and password**: HTTP Basic with a Boond user's credentials.

API access must be enabled for the account in Boond (administrator dashboard or user settings > security).

## Known gaps

- The package targets the shared host `ui.boondmanager.com`; dedicated instances on other hosts are not supported.
- The `X-Jwt-App-BoondManager` marketplace scheme, file downloads and uploads, CSV exports, AI endpoints, and the long tail of configuration resources (roles, forms, thread, todolists, ...) are not exposed.
- Nothing here was exercised against a live Boond account; the OAuth token endpoint's client authentication method (`client_secret_post`) follows common practice.
