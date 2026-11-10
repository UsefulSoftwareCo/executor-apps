# TaxJar

Calculate sales tax and manage TaxJar data: tax categories, rates by location, tax calculation for an order, order and refund transactions (list, show, create, update, delete), exempt customers, nexus regions, address validation and summary rates.

**Interface:** hand-written tools over the REST API at `https://api.taxjar.com/v2/` (reference: https://developers.taxjar.com/api/reference/). TaxJar publishes no OpenAPI document (the official `taxjar/openapi` repository is empty), so the tools are written by hand from the API reference. 21 tools; every create/update/delete (and the POST address validation) requires approval.

**Auth:** API token (`apiKey`), sent as `Authorization: Bearer <token>`. Create it in TaxJar under Account > API Access. TaxJar offers no OAuth for individual users.

**Known gaps:** TaxJar offers a sandbox (`api.sandbox.taxjar.com`) for Professional plans, but this package does not support it; tokens are production only. Categories require a paid account and address validation depends on the TaxJar plan. Requests send `x-api-version: 2022-01-24` so response shapes do not depend on the account default. Every rate lookup and tax calculation counts toward the monthly transaction limit.
