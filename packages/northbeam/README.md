# Northbeam

Marketing attribution from Northbeam in Executor: spend, revenue, ROAS, orders and dashboards. Two interfaces, chosen by how the account signs in.

- OAuth accounts use Northbeam's official remote MCP server, `https://mcp.northbeam.io` (https://docs.northbeam.io/docs/northbeam-mcp). It is read-only; any tool without a read-only hint is approval-gated anyway. The tool count cannot be listed without credentials.
- API-key accounts use hand-written tools over Northbeam's REST APIs (https://docs.northbeam.io/llms.txt), because the OpenAPI documents (docs.northbeam.io/openapi/*.json) sit behind the docs login. Tools: `orders.list` (v2), `spend.list`, `exports.attributionModels`, `exports.metrics`, `exports.breakdowns`, `exports.result` and `exports.create` (Sales Attribution export to Northbeam documents; approval required). Endpoints and parameters come from the per-operation reference pages.

## Auth

- API key: create a key and note your client ID at https://dashboard.northbeam.io/settings/api-keys. Executor sends the key as `Authorization` and the client ID as `Data-Client-ID` to `api.northbeam.io`. Health check: `GET /v1/exports/attribution-models`. The UAT host (`api-uat.northbeam.io`) is not supported.
- OAuth: the server publishes RFC 8414 metadata with dynamic client registration, PKCE S256 and a public client (`none`). Executor requests scopes `access:mcp` and `offline_access` (the latter so refresh tokens are issued); sign in with your normal Northbeam login. There is no OAuth app to create; the redirect URI is registered automatically.

## Known gaps

REST write operations are not included except `exports.create`: upserting orders and spend, patching orders, order aliases, deleting spend, hourly spend and the GCS/S3 export destinations. Their request bodies could not be verified. `exports.create` takes the request body as a JSON object.
