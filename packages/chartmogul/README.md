# ChartMogul

Subscription analytics and revenue data in ChartMogul: customers, subscriptions,
invoices, plans, activities and revenue metrics (MRR, ARR, churn, LTV).

Interfaces, chosen by how the account connects:

- OAuth accounts use ChartMogul's official remote MCP server,
  `https://mcp.chartmogul.com`. Tools are whatever the server lists for the
  account (count not probed without a real account).
- API key accounts use 24 hand-written tools over the REST API
  `https://api.chartmogul.com/v1` (account, data sources, plans, plan groups,
  customers incl. create/update/delete, subscriptions, invoices, activities and
  the metrics endpoints). ChartMogul's API reference at
  https://dev.chartmogul.com/reference offers no OpenAPI/Swagger download
  (checked: the reference pages, `/openapi.json` and `/openapi.yaml` on
  dev.chartmogul.com, all without a spec), so the tools are hand-written. List and
  metric tools take `query` (filters, `page`, `per_page`, `start-date`, ...);
  create/update take `body`.

Auth:

- API key (`apiKey`): create it in ChartMogul under Profile > API keys. Sent as
  HTTP Basic with the key as username and an empty password
  (https://dev.chartmogul.com/docs/authentication). Health check: `GET /v1/ping`.
- OAuth (`oauth`): discovery from
  `https://mcp.chartmogul.com/.well-known/oauth-authorization-server`, which
  advertises dynamic client registration (`/oauth/register`), PKCE S256, public
  clients (`token_endpoint_auth_methods_supported: ["none"]`) and scope `mcp`.
  The public-client flow was not exercised end to end (no account connected). If
  registration is refused, use Executor's redirect URI shown on the connect page.
  OAuth tokens work only against the MCP server, not the REST API.

Approvals: MCP tools not marked read-only, and REST create/update/delete, ask
for approval.

Known gaps: the API key cannot be used with the MCP server, so the two methods
expose different tool sets. REST coverage is a curated subset (import API,
subscription events, tags, custom attributes and contacts are not included).
