# BILL

Covers BILL (bill.com): AP bills, vendors, payments and approvals, AR customers and invoices, BILL Network, webhooks, partner operations, and the Spend & Expense API (budgets, cards, transactions, reimbursements).

Interface: OpenAPI, BILL's own v3 document at https://developer.bill.com/openapi/bill-v3-api.json (314 operations). The document lists only the sandbox server and no security schemes, so the package points it at production (`https://gateway.prod.bill.com/connect`) and fills the `sessionId`, `devKey` and `apiToken` header parameters from the account.

## Auth

- **Developer key and BILL sign-in** (`login`): AP, AR and the rest of v3. Create the developer key in the BILL developer portal (Settings, Developer Keys); enter it with the username, password and organization ID of a BILL user. The package calls `POST /v3/login` on first use, sends the returned `sessionId` with the `devKey`, and signs in again when BILL answers 401 (sessions idle out after 35 minutes). The password stays an Executor handle. A user that requires MFA needs a trusted sign-in, which this flow cannot complete.
- **Spend & Expense API token** (`spendToken`): a static token created in the BILL web app. It works for `/v3/spend/*` operations only.

There is no OAuth: BILL's Connect API has no user-created OAuth apps.

## Known gaps

- Production only. Sandbox (`gateway.stage.bill.com`) accounts and sandbox developer keys are not supported.
- Not covered: the legacy v2 API, Accountant Console and AP and AR sync-token sign-in (v2 login), and BILL Elements (browser components).
- Mutations ask for approval. `POST /v3/login` and `/v3/logout` are exposed as tools but the package manages the session itself.
