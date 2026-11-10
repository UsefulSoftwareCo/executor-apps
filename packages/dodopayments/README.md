# Dodo Payments

Payments, subscriptions, customers, products, discounts, licenses, refunds, disputes, meters and usage billing in Dodo Payments.

Interface: two routes, chosen by the account's auth method.

- API key (REST): 145 tools covering Dodo's documented REST API (docs: https://docs.dodopayments.com/api-reference/introduction). Dodo publishes no standalone OpenAPI file at a stable URL (`openapi.documented.yml` from its llms.txt returns 404, and the SDK repos carry no spec). Its docs do embed the official per-operation OpenAPI fragment on every API reference page, so `openapi-document.json` is those 145 fragments merged (live server only) and shipped with the package. If the docs change, regenerate it from the pages listed in https://docs.dodopayments.com/_llms/en/api-reference.txt. Non-GET operations (77) require approval.
- OAuth (MCP): Dodo's official remote MCP server, `https://mcp.dodopayments.com/mcp`. Its tool list needs an authenticated session and was not enumerated here (no real accounts are connected during authoring). Tools that are not read-only require approval.

Auth:

- API key: create it in the Dodo dashboard under Developer > API Keys. A key works only in the mode it was created in, so also enter the `environment` field as `live` (https://live.dodopayments.com) or `test` (https://test.dodopayments.com). A key without write access can use the read tools only.
- OAuth 2.0: the MCP server publishes RFC 8414 metadata and dynamic client registration, so no OAuth app has to be created by hand; the user signs in to Dodo Payments and picks the account.

Gaps: the REST route has no OAuth (Dodo's REST API accepts only API keys), and the MCP route has no API-key option. The public license endpoints (activate, validate, deactivate) are included and are sent the API key too.
