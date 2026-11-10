# Anrok

Sales tax and VAT compliance with Anrok: customers, tax exemption certificates and certificate requests, transactions (create, update, negate, void, list), products and product tax categories, filings, address resolution and tax ID validation.

## Interface

OpenAPI, from Anrok's official document at https://apidocs.anrok.com/openapi.yaml (API version 1.1, server https://api.anrok.com). Every operation is a POST; all mutations require approval.

## Auth

API key only. Anrok has no OAuth for sellers. Create a key at https://app.anrok.com/-/api-keys and paste it into the connection; it is sent as `Authorization: Bearer <key>` to `api.anrok.com`. The health check calls the read-only `productTaxCategories/list`.

## Known gaps

The default rate limit is 10 requests per second per seller account. Read-style endpoints that are POSTs (list, get, validate) are still classified by the framework by HTTP method, so they may ask for approval.
