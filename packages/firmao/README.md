# Firmao

Firmao is a Polish CRM and ERP. This package exposes its REST API: customers, contact persons, customer groups, sales notes, sales opportunities, projects, tasks, products, transactions (invoices, receipts, proformas, corrections), offers and orders, agreements, warehouse documents, files, emails, work time entries and transaction entries (list, so entry ids can be found before `deleteObject`) and invoice numbering series. Each resource has `list` (paging, sorting and `field(op)` filters) and `get`; most also have `create` and `update`. Objects are deleted by `update` with `{"deleted": true}`; `deleteObject` issues HTTP DELETE for objects without that flag.

Interface: hand-written tools over the official REST API, documented in Firmao's official technical document, https://firmao.pl/API%20Firmao.pdf (linked from https://firmao.pl/dokumentacja-techniczna/; supplemented by https://github.com/FirmaoCRM/API). Firmao publishes no OpenAPI document. Requests go to `https://system.firmao.pl/{organizationId}/svc/v1/...`.

## Auth

API login and password (HTTP Basic). In Firmao open Company > Settings > API, enable the API, copy the login and generate a password. The organization id is the first path segment of the URL after you sign in to Firmao. Firmao has no OAuth. Every mutation requires approval.

## Known gaps

- Create and update bodies are free-form JSON (the field lists are in Firmao's import help), not typed schemas.
- PDF downloads, file upload and the time-entry and invoice-line sub-endpoints beyond the generic `deleteObject` are not wrapped.
- The maximum `limit` depends on the Firmao licence.
- Firmao limits the API to 60 requests per minute and 5 concurrent requests; beyond that it returns HTTP 429. The tools report the limit in the error but do not retry or back off.
