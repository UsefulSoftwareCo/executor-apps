# Triple Whale

Ecommerce metrics, attribution, ads performance and store analytics from a Triple Whale
account, through Triple Whale's official remote MCP server,
`https://mcp.triplewhale.com/sse` (streamable HTTP despite the path).

Interface: Triple Whale publishes no single OpenAPI document (its docs at
https://triplewhale.readme.io embed one fragment per endpoint, about a dozen in all), so the
MCP server, which exposes read access to the account's data, is used. Tools are whatever
the server lists for the account; the list needs credentials, so no tool count is recorded.

Auth:

- API key (`apiKey`): in Triple Whale go to Data > APIs, click Generate and enable the
  "MCP: Read" scope (https://triplewhale.readme.io/reference/creating-and-managing-triple-whale-api-keys).
  Sent in the `x-api-key` header. The server accepts this header; whether it validates the
  key was not checked with a real key.
- OAuth (`oauth`): the server publishes OAuth metadata (scopes `moby:read`, `offline_access`)
  and dynamic client registration, so Executor registers its own client. The shop's plan
  must include MCP.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: Data-In (write) endpoints such as orders, ads and customers, and the
Summary Page, attribution and SQL REST endpoints under `api.triplewhale.com/api/v2`, are not
exposed here. Account health only verifies the credentials reach the MCP server.
