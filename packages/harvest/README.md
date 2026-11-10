# Harvest

Time tracking and invoicing for Harvest: company settings, clients and contacts, projects with their user and task assignments, tasks, time entries (including start/stop timers), expenses and categories, invoices (messages, payments, item categories), estimates, users (rates, roles, teammates, project assignments) and the time, expense, uninvoiced and project-budget reports. 112 tools.

**Interface:** hand-written tools over the Harvest API v2 (`https://api.harvestapp.com/v2`, documented at https://help.getharvest.com/api-v2/). Harvest publishes no OpenAPI document, so the endpoints are transcribed from the official docs. Every request sends the required `User-Agent` and `Harvest-Account-Id` headers. Mutations require approval.

**Auth**

- Personal access token: create one at https://id.getharvest.com/developers. Enter the token and the account id shown beside it.
- OAuth2: create an OAuth2 application at https://id.getharvest.com/developers and enter its client id and secret in the connect page. Register Executor's callback URL as the application's redirect URL. Harvest OAuth has no scopes. The account id is looked up from `https://id.getharvest.com/api/v2/accounts`; the login must have exactly one Harvest account (Forecast accounts are ignored), otherwise requests fail.

Endpoints were checked against the Harvest API v2 reference (company, time entries, user billable and cost rates, project budget report). User rates are list/get/create only, as documented.

**Known gaps**

- OAuth logins with several Harvest accounts are rejected with an error rather than guessing; connect a personal access token to pick a specific account.
- Receipt upload on expenses (multipart) is not supported; `delete_receipt` is.
- Not verified with a real account.
