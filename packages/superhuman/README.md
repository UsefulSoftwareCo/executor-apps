# Superhuman

Superhuman Mail inbox and calendar access for AI tools: search and read email,
draft and send messages, and manage calendar events. Tools are whatever the
server lists for the account.

Interface: Superhuman's official remote MCP server for Mail,
`https://mcp.mail.superhuman.com/mcp`. Superhuman publishes no OpenAPI or GraphQL
API for Mail (its Coda and Grammarly platforms are separate products), so the MCP
server is used. This package also covers the catalog target "Superhuman (MCP)".

Auth:

- OAuth (`oauth`): the only method the server accepts. It publishes OAuth
  metadata (`https://mcp.auth.mail.superhuman.com`) with dynamic client
  registration (authorization code with PKCE), so Executor registers its own
  client and the user signs in with their Superhuman account in the browser.
  Scope: `offline_access`. If registration is refused, use the redirect URI shown
  on Executor's connect page.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: no API-key access. Only Superhuman Mail is covered, not Coda, Grammarly
or Superhuman Go. The icon is the mark from Superhuman's Mail logo SVG
(superhumanstatic.com), cropped from the wordmark. Account health only verifies
the token reaches the MCP server.
