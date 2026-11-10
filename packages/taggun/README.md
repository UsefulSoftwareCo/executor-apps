# Taggun

Receipt and invoice OCR: simple and verbose extraction (file upload, public URL or base64), inline-rule receipt validation, stored validation campaigns, and data enrichment (product categories, product codes, known merchants).

## Interface

OpenAPI, from Taggun's official reference at https://developers.taggun.io/reference/overview. Taggun publishes an OpenAPI definition on each endpoint's reference page but no combined document, so `openapi.json` merges those 20 official fragments (all `https://api.taggun.io`).

## Auth

- API key (`secrets`): sent in the `apikey` header. It is emailed on sign-up and shown in the account dashboard at https://www.taggun.io/account/. Taggun has no OAuth.
- The health check calls `GET /api/account/v1/product-categories/export` (no scan is consumed). Taggun returns 401 for a missing key and 403 for an invalid key; both fail the check, only 2xx passes.

All POST/PUT/DELETE operations, including extraction (which consumes scans), require approval.

## Known gaps

- Upload endpoints take multipart files; pass content as the tool's file fields.
- Product-code upload is documented by Taggun as `POST /api/account/v1/known-product-codes/export` (same path as the export GET); it is kept as published, not renamed to `/import`, and has not been confirmed with Taggun support (support@taggun.io). Taggun's own docs are inconsistent here.
- Product categories, known merchants, validation and some features depend on plan or account configuration.
