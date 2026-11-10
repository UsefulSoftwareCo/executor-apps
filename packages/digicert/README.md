# DigiCert

DigiCert CertCentral: order, reissue, duplicate, download and revoke certificates, and manage domains and domain control validation (DCV), organizations, users, containers, products, reports and account balance.

## Interface

Custom tools written against the CertCentral Services API v2 (`https://www.digicert.com/services/v2`, docs at https://dev.digicert.com/en/certcentral-apis/services-api.html). DigiCert publishes no OpenAPI document and no remote MCP server for CertCentral (its only MCP server is for Trust Lifecycle Manager on DigiCert ONE, a different product), so each tool maps to one documented endpoint. Endpoints and fields were checked against the developer docs. Tools are grouped: `account`, `orders`, `certificates`, `domains`, `organizations`, `users`, `containers`, `products`, `reports`, `finance`. List tools take `filters` (sent as `filters[key]`), `sort`, `limit` and `offset`. Write tools take the documented JSON payload in `body`; every write asks for approval.

## Auth

CertCentral API key, sent in the `X-DC-DEVKEY` header. Create it in CertCentral under Account > API keys (a key is tied to a user; use a service user with the minimum role needed, and an admin key only if you need `skip_approval`). Two connection methods exist because accounts live on one region:

- `apiKey`: US accounts, `www.digicert.com`
- `apiKeyEu`: EU accounts (console shows "CertCentral Europe"), `certcentral.digicert.eu`

DigiCert offers no OAuth for the Services API.

## Known gaps

- Not covered: the per-product order endpoints are all one `orders.order` tool (the product goes in the path, the payload in `body`); users and containers writes, webhooks, vouchers, CT log monitoring, vulnerability assessments, KeyLocker, site seals, SAML/OIDC SSO, AuthKeys, finance writes and reads beyond balance (balance history, purchase history, receipt info, transfer funds, price estimate), the Order report, domain locking, CAA and the expiring-domains count, API keys, subaccounts, IP restrictions, Requests, Authorization, and the separate Discovery, Automation and Report Library APIs are not exposed.
- `orders.order` spends account balance or card funds; read the product's page for the fields it needs.
- Zip certificate formats are returned base64-encoded.
- The revoke payload field is documented as `comment` in the parameter table but `comments` in the cURL example; the tool sends whatever `body` you give it.
- No official OpenAPI document was found on the DigiCert developer site; a final search of GitHub for one could not be run, so the custom interface stands on the docs index linking none.
