# Baremetrics

Subscription analytics in Baremetrics: MRR, churn, customers, plans,
subscriptions and revenue metrics. Tools are whatever Baremetrics' MCP server
lists for the account.

Interface: Baremetrics' official remote MCP server, `https://app.baremetrics.com/mcp`.
Baremetrics publishes no OpenAPI document for its REST API
(`https://api.baremetrics.com`, docs at https://developers.baremetrics.com), so
the MCP server is used.

Auth:

- API key (`apiKey`): sent as a Bearer token. Create it in Baremetrics under
  Settings > API keys.
- OAuth (`oauth`): the server publishes OAuth metadata and dynamic client
  registration (authorization code with PKCE, scopes `read` and `write`), so
  Executor registers its own client. If registration is refused, use the
  redirect URI shown on Executor's connect page.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: the tool list could not be enumerated without a real account.
Account health only verifies the credential reaches the MCP server.
