# DeBounce

DeBounce email validation: validate a single address, reverse email lookup (data append), check credit balance and daily usage, upload a list for bulk validation and poll its status, and check whether an email or domain is disposable.

## Interface

OpenAPI, from DeBounce's three official documents listed at https://developers.debounce.com/llms.txt, mounted in one router:

- `validation` (https://developers.debounce.com/api-reference/openapi-validation.json, origin `api.debounce.io`): validate email, reverse lookup, balance, usage history.
- `bulk` (https://developers.debounce.com/api-reference/openapi-bulk.json, origin `bulk.debounce.io`): upload a list by URL, check status.
- `disposable` (https://developers.debounce.com/api-reference/openapi-disposable.json, origin `disposable.debounce.io`): public disposable-email detector, no key needed.

## Auth

API key. Create it on the API page of the DeBounce dashboard (https://app.debounce.io/api). DeBounce only accepts the key as the `api` query parameter. Use a private key: public keys are limited to a few validations per IP per day.

## Known gaps

- The Logo API (free endpoint) is not exposed. The vendor publishes no OpenAPI document for it.
- Bulk upload spends credits and needs an HTTPS URL to a `.csv` or `.txt` file you host.
- The icon is DeBounce's official site icon (PNG); no SVG is published.
