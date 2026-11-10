# Airwallex

Airwallex business finance (balances, global accounts, payments, payment links,
transfers, FX conversions, issued cards and cardholders, billing, spend and
expense management) through two official interfaces on one provider. The
account's auth method decides which tools appear.

Interfaces:

- REST API (`apiKey` method): Airwallex's official OpenAPI 3.1 document (MIT),
  <https://github.com/airwallex/airwallex-openapi>, pinned to the
  `openapi/client-api/2026-08-21/` version folder (raw JSON URL in `openapi.ts`).
  395 tools (204 mutations); 34 operations are skipped as `multiple_hosts`
  because they target other Airwallex origins (for example file upload). Tools go
  to production (`api.airwallex.com`) only; the sandbox server in the document is
  not used. Bump the folder date to adopt a newer API version.
- AgentOS MCP (`oauth` method): Airwallex's official remote MCP server,
  `https://mcp.airwallex.com/mcp` (production). The tool list needs credentials,
  so no count is verified here.

Auth:

- API key (`apiKey`): create an API key in the Airwallex web app (Settings,
  Developer, API keys) and paste the client ID and API key. The app calls
  `POST /api/v1/authentication/login` with `x-client-id` and `x-api-key`, caches
  the returned bearer token for 25 minutes (tokens last 30) and logs in again on
  a 401. Account health performs the same login so refused keys show on the
  connect form. `x-login-as` (for platform accounts acting for a connected
  account) is not supported.
- OAuth (`oauth`, MCP only): the server publishes RFC 8414 metadata (issuer
  `https://mcp.airwallex.com/mcp`) with dynamic client registration, so Executor
  registers its own client; no manual OAuth app is needed. The OAuth token is
  for the MCP server, not the REST API. Only the read (`r:`) scopes are
  requested, because omitting `scopes` requests every advertised scope including
  billing, issuing, contact and payment-link writes. Write tools on the MCP
  server will be refused until write scopes are added (changing scopes creates a
  new provider, so users must reconnect). Consent is tied to the user who granted
  it; per Airwallex's docs only Owner, Admin and Finance Admin users can complete
  the flow. If that user loses the role or disconnects the app, token refresh
  fails (`invalid_grant`) and the account must be reconnected. Card and issuing
  tools may need extra permissions and return 403 without them.

Approvals: every REST mutation and every MCP tool not marked read-only asks for
approval.

Known gaps: the sandbox MCP (`mcp-demo.airwallex.com/developer`) and sandbox
REST server are not wired up. MCP account health only verifies the token reaches
the MCP server. The icon is the official Airwallex mark from
https://www.airwallex.com/static/favicons/safari-pinned-tab.svg.
