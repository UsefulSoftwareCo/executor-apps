# Deel

Contracts, workers, EOR and global payroll, invoices and payments, time off, timesheets, milestones, legal entities, webhooks and organization data in Deel.

**Interface:** Deel's official OpenAPI 3.0.1 definitions, `https://api.letsdeel.com/openapi/rest/definitions` (linked from developer.deel.com), loaded live and compiled into 505 tools (247 mutations, every one asking for approval). Calls go to `https://api.letsdeel.com/rest`. Deel also runs an MCP server at `https://api.letsdeel.com/mcp`, but the REST spec is broader and is the only interface mounted.

**Auth:**

- API token: in Deel open **More > Developer > Access Tokens** and generate an organization or personal token. Sent as a Bearer token.

**Known gaps:**

- OAuth is not offered. Deel requires an `x-client-id: <client id>` header alongside the Bearer token on every OAuth2 call (missing it returns 401, per developer.deel.com/docs/oauth2), and the apps framework keeps the OAuth client id host-side (account fields expose only `access_token`), so it cannot be sent. Use an API token. Write scopes such as candidates:write, organizations:write, payslips:write, profile:write and public-token:write would also need requesting once OAuth is added.
- The Deel sandbox (`api-sandbox.demo.deel.com`) is not offered; accounts use production.
- The spec is large (4.5 MB) and unversioned, so operations may drift between deploys.
