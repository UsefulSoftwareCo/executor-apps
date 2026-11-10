# sevdesk

Accounting for sevdesk (German online bookkeeping): contacts, invoices, credit notes, orders, vouchers, bank transactions, check accounts, parts, tags, exports and more.

Interface: OpenAPI, the vendor's official document at https://api.sevdesk.de/openapi.yaml (API base `https://my.sevdesk.de/api/v1`). Every mutation requires approval.

Auth: API token (`apiKey`). Each sevdesk administrator has one 32-character hexadecimal token, found in sevdesk under Settings > User > API token. It is sent as the raw `Authorization` header value (no `Bearer` prefix). sevdesk offers no OAuth for user-created apps, so none is declared.

Known gaps: the spec's second server (`sevdesk.local`) is an internal instance and is ignored; only `my.sevdesk.de` is allowed. The health check calls `/Tools/bookkeepingSystemVersion`.
