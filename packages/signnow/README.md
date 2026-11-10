# SignNow

Templates, documents and document groups, signature invites, embedded signing,
sending and editing links, signing status and document downloads in SignNow.

## Interface

SignNow's hosted remote MCP server, `https://mcp-server.signnow.com/mcp`,
documented at https://docs.signnow.com/docs/signnow/mcp-server (the source of
truth). The open-source repository https://github.com/signnow/sn-mcp-server is
archived (read-only), so it is only a reference for the tool list, not an
active source. SignNow does not publish a current OpenAPI document (the former
`signnow/OpenAPI-Specification` repository no longer resolves and its raw spec
returns 404), so the hosted MCP server is the most complete official
interface. It is narrower than the REST API: about 25 tools (templates,
documents, contacts, invites, embedded links, status, downloads). Tools are
whatever the server lists; every tool that is not marked read-only asks for
approval.

## Auth

- OAuth 2.0 with dynamic client registration. The server is its own
  authorization server (`oauth2({ discover })`), so no OAuth app needs to be
  created; the user signs in to SignNow when connecting. Scopes: `*` (the
  only non-offline scope the server advertises, i.e. its full-access scope)
  and `offline_access` (for refresh tokens). The server requires S256 PKCE and
  supports token endpoint auth methods `none` and `client_secret_post`.
- The connect flow was not exercised with a real account; the framework's
  default token auth method was not confirmed against a live connect.

No API key method: the MCP server accepts OAuth bearer tokens only.

## Known gaps

- Coverage is the MCP server's toolset, narrower than SignNow's full REST API
  The count of about 25 comes from the upstream
  README and docs and was not verified against an authenticated session.
- The icon is SignNow's official 180px app icon (apple-touch-icon); it keeps a
  white tile in the dark variant. The vendor's SVG (safari-pinned-tab.svg) is a
  black single-colour mask that disappears on dark backgrounds, so it is not used.
