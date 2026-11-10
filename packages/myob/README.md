# MYOB

Covers the MYOB AccountRight API (cloud company files): chart of accounts, tax codes, categories, jobs, general journals, customers, suppliers, employees, sales and purchase invoices/orders/quotes/bills, customer and supplier payments, refunds, inventory items and locations, and spend/receive/transfer money transactions.

**Interface:** hand-written tools over `https://api.myob.com/accountright` (custom). MYOB publishes no OpenAPI document or MCP server; resources follow the official reference at https://developer.myob.com/api/accountright/v2/. 159 tools.

**Auth:** OAuth 2.0 only (MYOB has no static API token; access tokens last 20 minutes and are renewed by Executor). Register an app at https://my.myob.com/au/Developer, add the Executor redirect URI shown on the connect page as the app's redirect URI, and enter its client id and secret on the connect page. Scope: `CompanyFile`.

MYOB also requires the developer app's API key (the same value as the client id) in an `x-myobapi-key` header on every request. Executor does not expose an OAuth client id to app code, so the app has a second account requirement, "MYOB developer app key", where you paste that key.

**Usage:** call `companyFiles.list`, then pass the chosen `Id` as `companyFileId`. Company files with their own logins also need `companyFileToken` (base64 of `username:password`), sent as `x-myobapi-cftoken`.

**Known gaps:** payroll, reports, the Essentials (new) API, and attachments are not covered. Regional endpoints beyond the AccountRight cloud API are not covered. No health check, because the key lives in a separate account.
