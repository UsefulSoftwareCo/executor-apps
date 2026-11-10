# Paychex

Paychex Flex payroll and HR data: the companies an API application can access, their workers (employees and independent contractors), and worker communication details, plus a read-only `request` tool for any other Paychex API path the application is entitled to.

## Interface

Hand-written tools (8, all read-only) over the Paychex REST API at `https://api.paychex.com`, documented at https://developer.paychex.com/. Paychex publishes no public OpenAPI document and no remote MCP server, and its API reference is not publicly browsable, so only the endpoints shown in the public getting-started guides are declared: `GET /companies`, `GET /companies/{companyId}`, `GET /companies/{companyId}/workers`, `GET /workers`, `GET /workers/{workerId}` and the worker communications paths. Other GET paths (pay periods, checks, organizations and so on) are reachable through `request` with the right vendor `Accept` media type.

## Auth

- **API application (OAuth2 client credentials).** Register as a Paychex client or partner through https://developer.paychex.com/ to obtain a client id and client secret (sandbox credentials are available from the "Getting your sandbox" guide). Executor exchanges them at `https://api.paychex.com/auth/oauth/v2/token` (client_secret_post, form body; Paychex documents no scopes, so the scope list is empty) using the native client-credentials grant, and handles the one-hour token expiry and re-exchange. There is no authorization-code flow for API applications, so no redirect URI.

## Known gaps

- No write tools: the public guides do not document create or update calls.
- Pay periods, checks, organizations, job titles, earnings and webhooks are not declared; use `request` for reads.
- Access is granted per company by Paychex; the token only sees companies the application was approved for.
- The icon is the Paychex mark from Simple Icons.
