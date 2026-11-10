# Cashfree

Cashfree Payments (India): orders, payments, payment links, refunds, disputes,
settlements, reconciliation, subscriptions, customers, offers, softPOS and
easy-split. Also covers the catalog target "Cashfree MCP".

Interfaces, mounted as two routers under one app:

- `api`: Cashfree's official Payment Gateway OpenAPI document,
  https://www.cashfree.com/docs/openapi/payments/v2026-01-01.yaml (version
  2026-01-01; linked from https://www.cashfree.com/docs/llms.txt). 96 tools
  (58 mutations). One operation is skipped: `GET
  /customers/{customer_id}/instruments?instrument_type=card` puts a query
  string in the path, which the generator rejects; saved-card listing
  by instrument type is therefore a gap. The document lists a sandbox and a
  production server; the account's environment decides which one receives the
  keys.
- `mcp`: Cashfree's official remote MCP server, `https://mcp.cashfree.com/mcp`
  (https://www.cashfree.com/docs/tools-ai/mcp-server). It adds dashboard,
  settlement and report tools (transaction search, reconciliation reports,
  report download) that are not in the REST document. The vendor docs list 37
  tools in tables plus two dispute tools named in use cases; the count was not
  confirmed against a live authenticated `tools/list`.

Auth:

- API key (`apiKey`, `api`): the Payment Gateway app ID (`x-client-id`) and
  secret key (`x-client-secret`) from Developers > API Keys in the Merchant
  Dashboard, plus the environment (`production` or `sandbox`). Production uses
  `api.cashfree.com`, sandbox uses `sandbox.cashfree.com`. Payment Gateway API
  keys are not accepted by the remote MCP server, which lists only OAuth.
- OAuth (`oauth`, `mcp`): the only method the MCP server accepts. It publishes
  RFC 8414 metadata and uses dynamic client registration
  (`https://mcp.cashfree.com/oauth/register`) with authorization code and PKCE
  (S256). The token endpoint advertises `client_secret_post` only, so the
  package sets `tokenEndpointAuthMethod: "client_secret_post"` explicitly.
  The user signs in to the Merchant Dashboard in the browser and needs
  owner-level access. Scopes: `mcp-pg-read`, `mcp-pg-write`,
  `mcp-workflows-read`, `mcp-workflows-write` (all of `scopes_supported`).

Verification: the OAuth path is metadata-verified only (discovery document,
scopes and the 401 challenge on `/mcp`); no sign-in, registration, token
exchange or authenticated call has been run. The REST health check treats HTTP
401/403 on a read-only lookup of a nonexistent order as bad keys; it has not
been run against live credentials either.

Approvals: every REST mutation and every MCP tool the server does not mark
read-only asks for approval.

Known gaps: the separate Relay MCP server (gamma environment only) is not
included. Payouts and SecureID are separate Cashfree products with their own
keys and specs and are not part of this package. MCP account health only
verifies the token reaches the MCP server.
