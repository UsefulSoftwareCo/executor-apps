# MX Technologies

Covers the MX Platform API for aggregating and enhancing financial data: users, members, institutions, accounts, transactions, categories, merchants, budgets, goals, holdings, statements, ACH returns, widgets and more. Mutations require approval.

Interface: OpenAPI, from MX's official document at https://docs.mx.com/openapi/platform-api/v20250224.yaml (version v20250224, sent as the `Accept-Version` header, which this package fills in as `v20250224` on every call; callers may override it).

Auth: one method, `apiKey`. Enter the environment (`integration` or `production`) and the Client ID and API key from the MX Client Dashboard (https://dashboard.mx.com); they are sent as HTTP Basic credentials (client ID as username, API key as password). MX has no user-created OAuth apps for the Platform API.

Known gaps:
- Each account is bound to one environment, chosen when it is connected: `integration` (`https://int-api.mx.com`, which MX's API reference uses for its examples, works with the free developer API keys and offers the MX Bank and MXCU test institutions) or `production` (`https://api.mx.com`). MX issues production keys only on request, so most new users should start with `integration` and developer keys.
- Other MX surfaces (MDX Real Time, MDX On Demand, Migration, Reporting, legacy Atrium and Nexus APIs) are not included.
- Four operations use MX's bearer processor-token scheme instead of Basic and are left out: `requestAccountNumber` (`GET /account/account_numbers`), `checkRealTimeAccountBalance` (`POST /account/check_balance`), `readAccountBalance` (`GET /payment_account`) and `getAccountOwnerInfo` (`GET /account/transactions`).
