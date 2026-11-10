# Ticket Tailor

Events, ticket types, orders, issued tickets, discounts, products, check-ins,
memberships and reporting for a Ticket Tailor box office. The exact tool set
is whatever the server lists for the connected account.

Interface: Ticket Tailor's official remote MCP server,
`https://mcp.tickettailor.ai/mcp` (documented at
https://developers.tickettailor.com/docs/mcp/). Ticket Tailor's REST API
(`https://api.tickettailor.com`, HTTP Basic with an API key, documented at
https://developers.tickettailor.com/docs/intro) is documented only as rendered
reference pages; the developer site's sitemap, the `tickettailor` GitHub
organisation and APIs.guru expose no downloadable OpenAPI/Swagger document, so
the MCP server is used. The vendor says the MCP server exposes all REST API
endpoints as tools. This package also covers the catalog target "Ticket Tailor
MCP".

Auth:

- OAuth (`oauth`): the server publishes RFC 8414 metadata at
  `https://mcp.tickettailor.ai/.well-known/oauth-authorization-server`
  (authorization, token and registration endpoints, scope `mcp.access`, S256
  PKCE, `client_secret_basic`/`client_secret_post`/`none`) and supports dynamic
  client registration, so Executor registers its own client. Per the vendor's
  authentication page (https://developers.tickettailor.com/docs/mcp/authentication),
  the OAuth prompt asks for a Ticket Tailor API key: create one in Settings >
  API in your box office and enter it in the prompt. The API key is not sent
  to the MCP server as a bearer token, so there is no separate API-key method.
  integrations.sh's "same API key via MCP OAuth" wording matches this. The
  unauthenticated server does not advertise protected-resource metadata
  (`mcp-probe` reports `credentials-or-undetermined`), so discovery points at
  the authorization server on the same origin, which was checked directly.

Approvals: every tool the server does not mark read-only asks for approval.
Issuing tickets through the MCP costs one Ticket Tailor credit per ticket.

Known gaps: the tool count is unobserved; the exact set is
whatever the server lists for the connected account. Account health runs the
framework's `mcpHealth` (initialize plus the first page of `tools/list`, both
read-only) with the bearer token.
