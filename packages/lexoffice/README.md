# Lexoffice

Lexware Office (formerly lexoffice), the German cloud accounting and invoicing product: contacts, articles, invoices, quotations, order confirmations, delivery notes, credit notes, down payment invoices, dunnings, recurring templates, bookkeeping vouchers, the voucher list, payments, payment conditions, posting categories, print layouts, countries, the organization profile and webhook event subscriptions (46 tools).

## Interface

Hand-written tools over the official Public API, `https://api.lexware.io/v1` (docs: https://developers.lexware.io/docs/). Lexware publishes no OpenAPI document (the docs site is HTML only) and no MCP server, and the only community specs cover a single action, so the endpoint list is written by hand from the docs. Mutations require approval.

## Auth

- API key: create one at https://app.lexware.de/addons/public-api. Sent as `Authorization: Bearer <key>`.
- The docs do not document OAuth for user-created apps, so only the API key is offered.

## Known gaps

- File upload and download (`/files`, `/vouchers/{id}/files`, `/{document}/file`) are omitted because they carry binary bodies. The `document` tools render a PDF and return its `documentFileId`; the vendor marks these `/{id}/document` endpoints as deprecated in favour of `/{id}/file` (binary, omitted). `vouchers.list` (`GET /vouchers?voucherNumber=`) is likewise deprecated in favour of `voucherlist.list`. `voucherlist.list` requires `voucherType` and `voucherStatus` per the API, but the tool does not enforce them and passes the API's 400 through.
- The API allows 2 requests per second and has a single live environment, with no sandbox.
- The icon is the Lexware "X" mark from the vendor's own favicon SVG (https://www.lexware.de/favicon.svg), since Simple Icons lacks it. The favicon is a vector SVG containing only the mark, so it stays sharp at 128px; the main logo (logo_lexware.svg) is a wordmark.
