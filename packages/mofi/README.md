# Mofi

Balances, cards, transactions, statements, recurring charges and spending from Brazilian banks connected to Mofi through regulated Open Finance (15 tools). Bank access is read-only and no tool moves money. Two tools write only inside Mofi and ask for approval: `mofi_classifications_save` (saves a transaction's category in Mofi) and `mofi_connections_sync` (requests a new sync of an existing bank connection). Every other tool is `readOnlyHint` and runs without approval.

## Interface

Mofi's official remote MCP server, `https://omofi.com.br/api/mcp` ([docs](https://omofi.com.br/docs/mcp), [manifest repo](https://github.com/Omofi/mofi-mcp), MCP Registry `br.com.omofi/mofi`). Mofi offers no public OpenAPI document, so the MCP server is the interface. Tools are listed live from the server.

The public `tools/list` on 22/11/2026 (America/Sao_Paulo) returned these 15 tools. Annotations are quoted from that listing.

- `mofi_identity_get` (Get your Mofi identity). Return the name and email of the owner authorizing this Mofi connection. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_accounts_get` (Get accounts). Find one owned account, list owned accounts, or filter by connection. Monetary values use { amount, currency } with amount as an exact decimal string; credit limits are not cash. Continue collections with page.nextCursor unchanged. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_cards_get` (Get cards). Find one masked card, list cards, or filter by account or connection. Monetary values use { amount, currency } with amount as an exact decimal string; credit limits and available credit are not bank cash. Pass page.nextCursor unchanged to continue the same query. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_spending_get` (Get spending). Aggregate debit transactions by category, merchant, month, weekday, account, or statement over an explicit period of at most 366 days. Totals use { amount, currency } with amount as an exact decimal string. For averages and top categories, prefer `mofi_spending_summary_get`. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_spending_summary_get` (Get spending summary). Use this first for how much was spent, monthly or weekly averages, and spending by category or merchant, over an explicit period of at most 366 days. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_connections_get` (Get connections). Find one connected institution, list connections, or filter by status. Results are owner-scoped. Continue a collection with page.nextCursor unchanged. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_recurring_get` (Get recurring spending patterns). Find repeated spending by payee (merchant or Pix recipient) and amount in an explicit period of at most 366 days. These are spending patterns, not confirmed subscriptions. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_classifications_get` (Get classification rules). Lists the canonical categories and supported exact-match provider rules. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_classifications_save` (Save transaction category). Set or clear your normalized category for one transaction. This personal override is applied to transaction, spending, and recurring results; provider labels stay unchanged. It does not move money. `readOnlyHint` false, `destructiveHint` true, `idempotentHint` true, `openWorldHint` false.
- `mofi_transactions_get` (Get transactions). Find an owned transaction by transactionId, list all, or AND untagged where predicates. Search matches description or merchant substrings. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_statements_get` (Get statements). Find or filter statements with observed linked-transaction totals by currency. Coverage is always unknown, so a match does not prove the bill is complete or paid. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_month_outlook_get` (Get month outlook). Read-only month outlook for checking balances, open card statements, and expected recurring debits. An estimate, not a guarantee. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_purchase_simulation_get` (Simulate a purchase). Read-only simulation of a purchase against this month's room. Numbers only; not advice and not a buy or do-not-buy recommendation. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_sync_get` (Get sync jobs). Read synchronization jobs by ID, list jobs, or filter by connection and/or status. Results are owner-scoped. `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false.
- `mofi_connections_sync` (Sync connection). Request a provider refresh and queue an import for one existing connection. Check `mofi_sync_get` before repeating an ambiguous request. This command never moves money. `readOnlyHint` false, `destructiveHint` true, `idempotentHint` false, `openWorldHint` true.

## Auth

- **OAuth** (`oauth`): discovered from the server's protected-resource metadata (authorization server `https://omofi.com.br`). The server advertises dynamic client registration and Client ID Metadata Documents with S256 PKCE and token endpoint auth method `none`, so Executor connects in one click with no user-owned OAuth app. Scopes from discovery: `mcp:read`, `mcp:sync`.

The user needs a Mofi account with an active plan and at least one bank connected in the Mofi app. Without an active plan the server answers 402.

Health check: `mcpHealth` (initialize and list tools with the account's credentials).

## Known gaps

- Brazilian banks only, through regulated Open Finance in Brazil.
- Bank connections are created in the Mofi app, not through MCP.
- Executor's `mcp-probe` reports `anonymous`, because `initialize` and `tools/list` answer without a token. Tool calls still need OAuth. This package declares OAuth so those calls carry the user's token.

## Icon

The official app icon (the "m." mark) published at `https://omofi.com.br/icon-1024.png`. The site's SVG favicon is the wordmark, so it was not used.
