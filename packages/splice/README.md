# Splice

Splice's sound catalog and stacks: search sounds, build, edit and share stacks,
and download eligible sounds using Splice credits (the exact set is whatever
the server lists for the account).

Interface: Splice's official remote MCP server, `https://mcp.splice.com/mcp`
(streamable HTTP). Splice publishes no public REST or GraphQL API, so the MCP
server is the only interface. This package covers the "Splice MCP" catalog
target.

Auth:

- OAuth (`oauth`): the only method; the server accepts no API key. It publishes
  OAuth metadata and dynamic client registration (authorization code with PKCE),
  so Executor registers its own client and the user signs in with their Splice
  account in the browser. Scopes: `openid`, `profile`, `email`, `offline_access`.
  If registration is refused, use the redirect URI shown on Executor's connect page.

Approvals: every tool the server does not mark read-only asks for approval
(downloads spend credits).

Icon: the Splice mark from splice.com's own site assets.

Known gaps: tool count is unverified without a signed-in account. Account health
only verifies the token reaches the MCP server.
