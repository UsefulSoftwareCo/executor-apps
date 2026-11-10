# Zoho Books

Covers the whole Zoho Books REST API (878 tools): invoices, recurring invoices, estimates, sales orders, sales receipts, retainer invoices, credit and debit notes, delivery challans, bills, recurring bills, vendor credits and payments, purchase orders and returns, contacts and contact persons, items, price lists, expenses, banking (accounts, rules, transactions), chart of accounts, journals, fixed assets, projects, tasks, time entries, taxes, currencies, locations, reporting tags, users and organizations.

## Interface

OpenAPI, from Zoho's own definitions at <https://www.zoho.com/books/api/v3/openapi-all.zip>. Zoho publishes one OpenAPI 3.0 file per module and no combined file, so `document.json` is those files merged by `generate.py` (schemas and parameters are prefixed with their module name; operations and paths are otherwise untouched). To refresh it, extract the zip into a fresh directory and run `python3 generate.py <dir> document.json` (needs PyYAML). The definition names only the US host; `index.ts` pins the account's own data center as the only origin that receives credentials.

## Auth

OAuth 2.0 only. A pasted access token lasts one hour, so no API-key method is offered, and the framework has no secrets-method hook to exchange a refresh token. There is one method per Zoho data center: US, EU, India, Australia, Japan, Canada, Saudi Arabia, the United Arab Emirates and China. Pick the method matching the domain you see in the Zoho Books web app (`books.zoho.eu` is EU).

Create the client in the Zoho API Console for your data center (<https://api-console.zoho.com>, or the `.eu`, `.in`, ... equivalent): a Server-based Application, with Executor's redirect URI shown on the connect page as the authorized redirect URI. Paste its client ID and secret into the connect page. The scopes are the fifteen `ZohoBooks.<module>.ALL` scopes from Zoho's OAuth page, with `access_type=offline` and `prompt=consent` so Zoho returns a refresh token. Tokens go in the `Authorization: Zoho-oauthtoken <token>` header.

## Notes and gaps

- Every call needs `organization_id`; read it with the organizations tools (also shown in the account name).
- Zoho limits calls to 100 per minute per organization and a daily cap by plan.
- The self-billed-invoices module reuses `/bills` paths already defined by the bills module; those duplicates are dropped, so bills come from the bills module only.
- Zoho's `x-node_available_in` annotations are kept in the document and ignored.
- Mutations ask for approval on every call.
