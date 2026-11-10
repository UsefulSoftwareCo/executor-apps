# Stytch

Stytch authentication and identity (consumer users, B2B organizations and
members, sessions, passwords, OTP, magic links, OAuth, passkeys, Connected Apps) plus Stytch workspace management, on one provider. The account's auth
method decides which tools appear. The catalog target "Stytch MCP" is this
package.

Interfaces:

- Project API (`apiKey` method): Stytch's official OpenAPI 3.0 document,
  <https://raw.githubusercontent.com/stytchauth/stytch-openapi/main/openapi.yml>.
  178 tools (147 mutations); 6 operations are skipped as `multiple_hosts`
  because they target other origins. Tools go to the live server
  (`api.stytch.com`) only; the test server in the document is not used.
- Workspace MCP (`oauth` method): Stytch's official remote MCP server,
  `https://mcp.stytch.dev/mcp`, for projects, redirect URLs, SDK settings, email
  templates and API keys. The tool list needs credentials, so no count is
  verified here.

Auth:

- API key (`apiKey`): in the Stytch Dashboard open API keys for the project and
  paste the project ID and secret. They are sent as HTTP Basic credentials.
  Test projects use `test.stytch.com`, which is not wired up; use a live
  project's credentials.
- OAuth (`oauth`, MCP only): the server publishes RFC 8414 metadata and dynamic
  client registration, so Executor registers its own client; no manual OAuth app
  or redirect URI setup is needed. The token is for the MCP server, not the
  project API. Requested scopes: `openid email profile admin:projects
  manage:project_settings manage:project_data manage:api_keys:test`. Live API key
  management (`manage:api_keys`) is deliberately not requested.

Approvals: every REST mutation and every MCP tool not marked read-only asks for
approval. Many Stytch "get" style calls are POST searches; they are marked as
mutations by the generator and so also ask for approval.

Known gaps: the 6 skipped operations are the fraud and email-risk APIs on
`telemetry.stytch.com` (`/v1/fingerprint/lookup`, `/v1/rules/set`,
`/v1/rules/list`, `/v1/verdict_reasons/override`, `/v1/verdict_reasons/list`,
`/v1/email/risk`); no fraud tools are exposed. The test server and workspace Management API (key-based, separate
from the MCP server) are not exposed over REST. MCP account health only checks
the token reaches the MCP server. The icon is the Stytch wordmark taken from the
site header at https://stytch.com/ (Stytch publishes no separate symbol). The SVG's "by Twilio" line was cropped
out so only the Stytch wordmark remains. Health checks call `GET /v1/debug/whoami`.
