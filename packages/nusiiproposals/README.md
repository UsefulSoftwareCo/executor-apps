# Nusii proposals

Work with a Nusii account: proposals, clients, sections, line items, templates,
taxations, themes, users and webhook endpoints, including sending a proposal.

Interface: Nusii's official OpenAPI 3.1 document,
`https://developer.nusii.com/openapi/v2.yaml` (server `https://app.nusii.com`).
It compiles to 43 tools (21 reads and 22 mutations: 8 POST, 8 PUT, 6 DELETE), none skipped.

Auth (both methods are created in Nusii under Settings > API):

- API key (`apiKey`): copy your personal key from Settings > API. It is sent as
  `Authorization: Token token=<key>` to `app.nusii.com`.
- OAuth (`oauth`): register an OAuth application in Settings > API (name and
  redirect URI) and use its Client ID and Secret. The server publishes OAuth
  metadata at `https://app.nusii.com/.well-known/oauth-authorization-server`
  (authorization code with PKCE S256, refresh tokens, dynamic client
  registration). Scopes `read` and `write` are requested; Nusii's REST docs say
  `read` allows GET and `write` allows POST, PUT and DELETE. Use the redirect
  URI shown on Executor's connect page when registering the app. Not tested
  with a real account: the end-to-end OAuth connect, and whether the OAuth
  server's metadata (written for the `/mcp` resource) issues tokens accepted by
  `/api/v2`, are unverified. Nusii's REST docs describe OAuth for the API, which
  supports it.

Approvals: all 22 mutations (every POST, PUT and DELETE) ask for approval. That
includes `POST /api/v2/proposals/{id}/send_proposal`, which emails a proposal to
the client, so assistants can send proposals here once approved. It also
includes archiving proposals and deleting taxations, clients, line items and
other records.

Health check: `GET /api/v2/account/me`.

Known gaps: Nusii also runs remote MCP servers at `https://app.nusii.com/mcp`
(scopes `read`, `write`) and `https://app.nusii.com/admin_mcp` (scopes
`admin:read`, `admin:write`). Neither is mounted: the REST API covers the same
ground, and the admin server is excluded as an administrative surface. Icon:
Nusii's official 800px app icon (`https://nusii.com/images/logo.png`); Simple
Icons has no entry.
