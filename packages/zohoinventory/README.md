# Zoho Inventory

Covers the whole Zoho Inventory REST API (583 tools): items and composite items, item groups, contacts, sales orders, packages, shipments, invoices, customer payments, credit notes, purchase orders, receives, bills, vendor credits, transfer orders, inventory adjustments, price lists, taxes, locations, users and organizations.

## Interface

OpenAPI, from Zoho's own definitions at <https://www.zoho.com/inventory/api/v1/openapi-all.zip>. Zoho publishes one OpenAPI 3.0 file per module and no combined file, so `document.json` is those files merged by `generate.py` (schemas and parameters are prefixed with their module name; operations and paths are otherwise untouched). To refresh it, extract the zip into a fresh directory and run `python3 generate.py <dir> document.json`. The definition names only the US host; `index.ts` pins the account's own data center as the only origin that receives credentials.

## Auth

OAuth 2.0 only. A pasted access token lasts one hour, so no API-key method is offered. Zoho's self-client flow can mint a long-lived refresh token without a redirect, but a secrets method only injects a static header value and the framework has no secrets-method hook to exchange a refresh token for an access token, so that is not feasible here. There is one method per Zoho data center: US, EU, India, Australia, Japan, Canada, Saudi Arabia and China. Pick the method matching the domain you see in the Zoho Inventory web app (`inventory.zoho.eu` is EU).

Create the client in the Zoho API Console for your data center (<https://api-console.zoho.com>, or the `.eu`, `.in`, ... equivalent): a Server-based Application, with Executor's redirect URI shown on the connect page as the authorized redirect URI. Paste its client ID and secret into the connect page. The scope is `ZohoInventory.FullAccess.all`, with `access_type=offline` and `prompt=consent` so Zoho returns a refresh token. Zoho keeps at most 20 refresh tokens per user, deleting the oldest. Tokens go in the `Authorization: Zoho-oauthtoken <token>` header.

## Notes and gaps

- Every call needs `organization_id`; read it with `organizations.listOrganizations`.
- Zoho limits calls to 100 per minute per organization and a daily cap by plan.
- `document.json` keeps Zoho's `x-node_available_in` / `x-node_unavailable_in` availability annotations on schema and parameter objects. They are ignored here; only path-item level `x-` keys are stripped when merging.
- Mutations ask for approval on every call.
