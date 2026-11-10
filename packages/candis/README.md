# Candis

Candis is a German accounts payable and invoice automation platform. This package covers its public API: creating and reading exports and their postings, downloading exported PDF/XML files, importing and updating core data (general ledger accounts, cost centers and objects, tax codes, contacts, payment conditions, purchase orders, goods receipts, additional delivery costs), reading import logs, listing and updating invoices, and listing purchase requests and reimbursement items.

## Interface

OpenAPI, 27 operations, all on `https://api.candis.io`. Candis publishes no combined spec file: its ReadMe portal at https://developer.candis.io embeds one OpenAPI definition per endpoint in each reference page (append `.md` to a reference URL). `document.json` is those definitions merged, with the OAuth endpoints left out and a bearer security scheme added. Re-merge it when the portal changes. The official Candis MCP server at https://developer.candis.io/mcp only searches documentation, so it is not mounted.

## Auth

OAuth 2.0 authorization code flow (the only method Candis offers). Create credentials in the Candis app under Settings > Candis API > Credentials > Generate new, and add the Executor callback as one of the redirect URLs (up to 5 allowed). The client secret is shown only once. Endpoints come from OIDC discovery of `https://id.my.candis.io/auth/realms/candis`; the client authenticates with HTTP Basic. Scopes requested: `offline_access` (long-lived refresh), `core_data` and `exports`.

## Known gaps

Mutations (imports, updates, export creation) require approval. The `core_data` and `exports` scopes are marked experimental by Candis. The `{organizationId}` path parameter is the id returned by `getOrganization`.
