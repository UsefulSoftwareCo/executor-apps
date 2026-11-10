# Entrata

Entrata property management: applications, AR codes, payments and transactions, customers, financials (GL, budgets, jobs), leads and quotes, leases, leasing center call logs, maintenance work orders and inspections, pricing, properties, property units, vendors, invoices and purchase orders. 126 tools, one per documented web-service method.

## Interface

Hand-written tools over Entrata's official web-service API (https://docs.entrata.com/api/v1/documentation). Entrata publishes no OpenAPI document and no official MCP server. Every method is a POST to `https://{subdomain}.entrata.com/api/v1/{service}` with the body `{ "auth": { "type": "basic" }, "method": { "name", "version", "params" } }`; the services and method names are the ones in the vendor's documentation index. Each tool takes `params` (the method's documented parameters, not validated by the tool) and an optional `version` (default `r1`; use `r2` for methods that publish a Version 2, such as getLeases). Methods that change data (send, update, delete, move, cancel, mark, void, apply, generate, insert) require approval.

## Auth

HTTP Basic with an Entrata API user. Enter your account subdomain (the `acme` in `acme.entrata.com`), and the API username and password. Create the API user in Entrata under Apps > API Access > Add API User, enable the web services you want, and copy the credentials from the Credentials tab. API use requires an agreement with Entrata and may need IP allow-listing. Entrata also offers OAuth 2.0 bearer tokens, but only to App Store partner integrations, so OAuth is not wired.

## Gaps

- The API is gated, so nothing here was called against a live account; the exact request envelope (`requestId`, `version` strings) and the per-service URL paths follow the vendor docs and public integration guides and should be confirmed on first use.
- `sendLeaseDocuments` (multipart/form-data upload) is not exposed.
- Large reads are asynchronous on some methods; use `queue.getResponse` to fetch them.
