# YNAB

Budget plans, accounts, categories, payees, transactions, scheduled transactions, months and money movements from the YNAB API.

**Interface:** OpenAPI 3.1, YNAB's official document at https://api.ynab.com/papi/open_api_spec.yaml (API base `https://api.ynab.com/v1`). Mutations require approval.

**Auth**
- Personal access token: Account Settings > Developer Settings (https://app.ynab.com/settings/developer) > Personal Access Tokens > New Token. For your own account only.
- OAuth: create an OAuth application at the same page (New Application) and enter its client ID and secret on the connect page. Register Executor's callback URL as the application's redirect URI exactly. No scope is requested, so access is read/write; new YNAB OAuth apps are in Restricted Mode (limited to the first 25 non-owner authorizations) until YNAB reviews them. Access tokens last 2 hours and are refreshed.

**Known gaps:** YNAB rate limits tokens to 200 requests per hour.
