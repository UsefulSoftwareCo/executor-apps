# Moneybird

Contacts, sales invoices, estimates, purchase documents, bank accounts and mutations, products, time entries, subscriptions, ledger accounts and the rest of the Moneybird accounting REST API (v2).

**Interface:** OpenAPI. Moneybird publishes its own document at https://raw.githubusercontent.com/moneybird/openapi/main/openapi.json (repository https://github.com/moneybird/openapi), served from `https://moneybird.com/api/v2`. Mutations require approval. Most tools take an `administration_id`; list administrations first.

Moneybird also runs official remote MCP servers (`https://moneybird.com/mcp/v1/read_only` and `read_write`), but they cover far fewer operations than the REST API, so this package uses OpenAPI.

## Auth

- **Personal API token** (`token`): create one at https://moneybird.com/user/applications/new, choose "personal API token" and tick the scopes you need. It grants access to the user's whole account.
- **OAuth** (`oauth`): register an external OAuth application at the same page, then enter its Client ID and Client Secret on the connect page. Add Executor's redirect URI to the application. Requested scopes: `sales_invoices`, `documents`, `estimates`, `bank`, `time_entries`, `settings`.

## Known gaps

- Requests are made with the default JSON format; XML is not used.
- Webhook management is exposed as ordinary tools; incoming webhook events are not handled.
