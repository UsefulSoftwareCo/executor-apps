# MoonClerk

Read MoonClerk data: payment forms, customers (shown as "Plans" in the MoonClerk web app, with subscription, payment method, discount and checkout details) and payments, with the API's list filters and count/offset paging.

**Interface:** hand-written tools over the official REST API at `https://api.moonclerk.com/` (docs: https://github.com/moonclerk/developer/tree/main/api). MoonClerk publishes no OpenAPI document, and its API is read-only by design, so there are 6 query tools (list and get for forms, customers and payments) and no mutations or approvals. Requests send `Accept: application/vnd.moonclerk+json;version=1`.

**Auth:** API key (`apiKey`), sent as `Authorization: Token token=<key>`. Generate it at https://app.moonclerk.com/settings/api-key. MoonClerk has no OAuth.

**Known gaps:** no write operations exist in the API, and webhooks are configured in MoonClerk, not through this package. Amounts are integers in cents. Lists return 10 rows unless `count` (1-100) is set. The icon is MoonClerk's official 512px app icon from moonclerk.com.
