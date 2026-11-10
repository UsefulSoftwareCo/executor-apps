# CloudConvert

CloudConvert converts, optimizes, merges, archives, watermarks and captures files in 200+ formats. This package exposes jobs, tasks, imports and exports, operation discovery and webhooks.

## Interface

CloudConvert publishes no OpenAPI document, so the package has two interfaces, chosen by the connected account:

- OAuth account: the official remote MCP server at `https://mcp.cloudconvert.com` (about 25 tools, including `convertFile`, `optimizeFile`, `captureWebsite`, `mergeFiles`, the PDF tools and job/task lookup). Source: https://cloudconvert.com/docs/integrations/mcp-server. Input files must be reachable by HTTP(S) URL.
- API key account: hand-written tools over the REST API at `https://api.cloudconvert.com/v2` (https://cloudconvert.com/api/v2), 30 operations: account, jobs, tasks (import, export, convert, optimize, watermark, capture-website, thumbnail, merge, archive, command, metadata), discovery (operations, formats) and webhooks.

All mutations require approval; read-only MCP tools do not.

## Auth

- API key: create one at https://cloudconvert.com/dashboard/api/v2/keys with the scopes `user.read`, `task.read`, `task.write`, `webhook.read` and `webhook.write` as needed. It is sent as a Bearer token. The health check calls `/users/me`, so `user.read` is required.
- OAuth 2.0: discovered from the MCP server (authorization server `https://cloudconvert.com`, dynamic client registration, PKCE S256), so no client needs to be created. Granted scopes are `user.read`, `task.read` and `task.write` by default.

## Known gaps

- The sandbox API (`sandbox.api.cloudconvert.com`), the regional endpoints and the synchronous `sync.api` wait endpoints are not exposed; use `jobs.get` to poll.
- Filter keys in `query` are literal strings such as `"filter[status]"`.
- The standalone task paths (`/metadata`, `/metadata/write`, etc.) match the official CloudConvert Node SDK, which posts each task to `/{operation}`; the docs page lists them only as job operations.
- The REST tools take free-form `body` and `query` objects; task options are not typed per operation. Use `discovery.operations` to find valid options.
- Other import/export targets (S3, Azure, GCS, SFTP, OpenStack) are not wrapped in the API key interface; create them with `jobs.create`.
- Presets are only reachable through the MCP interface if it offers them.
