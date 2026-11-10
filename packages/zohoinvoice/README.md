# Zoho Invoice

Covers the whole Zoho Invoice REST API (268 tools): invoices, recurring invoices, estimates, retainer invoices, credit notes, customer payments, expenses and recurring expenses, expense categories, time entries, projects, contacts and contact persons, items, price lists, taxes, currencies, users and organizations.

## Interface

OpenAPI, from Zoho's own definitions at <https://www.zoho.com/invoice/api/v3/openapi-all.zip>. Zoho publishes one OpenAPI 3.0 file per module and no combined file, so `document.json` is those files merged by `generate.py` (schemas and parameters are prefixed with their module name; operations and paths are otherwise untouched). To refresh it, extract the zip into a fresh directory and run `python3 generate.py <dir> document.json`. The definition names only the US host; `index.ts` pins the account's own data center as the only origin that receives credentials.

## Auth

OAuth 2.0 only. A pasted access token lasts one hour, so no API-key method is offered, and the framework has no secrets-method hook to exchange a refresh token. There is one method per Zoho data center: US, EU, India, Australia, Japan, Canada, Saudi Arabia and China. Pick the method matching the domain you see in the Zoho Invoice web app (`invoice.zoho.eu` is EU).

Create the client in the Zoho API Console for your data center (<https://api-console.zoho.com>, or the `.eu`, `.in`, ... equivalent): a Server-based Application, with Executor's redirect URI shown on the connect page as the authorized redirect URI. Paste its client ID and secret into the connect page. The scope is `ZohoInvoice.fullaccess.all`, with `access_type=offline` and `prompt=consent` so Zoho returns a refresh token. Tokens go in the `Authorization: Zoho-oauthtoken <token>` header. `ZohoInvoice.fullaccess.all` is the broadest scope; Zoho also offers per-module scopes (for example `ZohoInvoice.invoices.READ`), but splitting them would drop tools across the 268 operations, so the broad scope is a deliberate trade-off.

## Notes and gaps

- Every call needs `organization_id`; read it with the organizations tool (GET /organizations).
- Zoho limits API calls per minute per organization and per day by plan.
- Zoho's `x-node_*` availability annotations are kept in `document.json` and ignored.
- Mutations ask for approval on every call.
- Not covered: bulk-only and webhook/workflow configuration that Zoho does not document in the OpenAPI files.
