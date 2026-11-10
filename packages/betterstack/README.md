# Better Stack

Uptime monitors, status pages, incidents, on-call, logs, metrics, traces and error tracking in Better Stack.

**Interface:** Better Stack's official remote MCP server, `https://mcp.betterstack.com` (https://betterstack.com/docs/getting-started/integrations/mcp/). Better Stack publishes no OpenAPI document, so the MCP server is the broadest official interface. Tools are discovered live; mutating tools require approval, tools with `readOnlyHint` do not.

**Auth:** Either an API token or OAuth 2.0. The API token is sent as `Authorization: Bearer <token>`, as Better Stack's MCP docs describe for clients without OAuth; the docs do not say which token type (global API token or Telemetry team token) the server accepts, so this package has not verified that. OAuth uses dynamic client registration (authorization server `https://betterstack.com`, scopes `read` and `write`, discovered from the server's metadata); no app needs to be created by hand. If your Executor host needs a redirect URI, use the one shown on the connect screen. Better Stack recommends OAuth where the client supports it.

**Known gaps:** Only the tools the MCP server exposes are available; the REST APIs (uptime, telemetry, errors) and their tokens are not exposed directly, so the MCP server should not be assumed to cover the whole REST surface. Log ingestion with source tokens is not exposed.
