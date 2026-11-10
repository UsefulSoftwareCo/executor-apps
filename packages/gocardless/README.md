# GoCardless

GoCardless direct debit and bank payments: customers, bank accounts, mandates,
payments, subscriptions, refunds, payouts, events, creditors, billing requests,
instalment schedules and webhooks.

Interfaces (one provider, the tool set depends on the account's auth method):

- Access token account: hand-written tools (about 55 operations) over the REST
  API at `https://api.gocardless.com` and `https://api-sandbox.gocardless.com`
  (version header `GoCardless-Version: 2015-07-06`), from the API reference at
  https://docs.gocardless.com/docs/api-reference. GoCardless links an OpenAPI
  specification from its docs, but no public machine-readable document could be
  found: `docs.gocardless.com/openapi.json` and `developer.gocardless.com/openapi.json`
  return 404, none of the docs pages (api-reference, developer-resources,
  postman-collection, client-libraries) link a spec, and the only spec found is a
  third-party 2-operation subset, which is not used. Hence hand-written tools.
  Create/update bodies are the resource fields; the API envelope (`customers`,
  `data`, ...) is added by the tool. Sandbox tokens (`sandbox_` prefix) go to the
  sandbox host, others to live.
- OAuth account: the official remote MCP server `https://mcp.gocardless.com`
  (also covers the catalog target "GoCardless MCP"). Tools are whatever the
  server lists for the account; listing needs credentials, so the count is
  unverified.

Auth:

- Access token (`apiKey`): create one at Developers > Create > Access token in the
  dashboard (https://manage.gocardless.com, or https://manage-sandbox.gocardless.com
  for sandbox). Read-only tokens work for the list/get tools. Whether the MCP
  server accepts these tokens is not documented and was not tested (a 401 with
  a fake token proves nothing), so the token account uses REST only.
- OAuth (`oauth`): the MCP server publishes OAuth metadata (authorization code,
  PKCE S256, public clients) and dynamic client registration at
  `https://mcp.gocardless.com/register`, so no OAuth app has to be created
  (registration with `https://executor.sh/_executor/auth/callback` succeeded).
  The environment (Sandbox or Live) is chosen in the browser during sign-in;
  switching environments needs a reconnect. The vendor does not document the
  token lifetime. A third party (Scalekit) reports re-authentication every two
  weeks for read-write and monthly for read-only connections, so a refresh-token
  failure is expected behavior to test. The host stores and refreshes OAuth
  grants when a refresh token is issued. No full sign-in was tested.

Approvals: every REST mutation asks for approval; MCP tools ask unless marked read-only.

Known gaps: REST coverage is a curated subset (no mandate imports, scenario
simulators, tax rates, outbound payments, bank authorisations); health on OAuth
accounts only verifies the token reaches the MCP server. Icon: the G mark from
gocardless.com's favicon (official SVG).
