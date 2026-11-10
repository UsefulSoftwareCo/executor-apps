# Carbon Voice

Voice messages, conversations, channels and collaboration workflows in
[Carbon Voice](https://www.carbonvoice.app/), through Carbon Voice's official
remote MCP server at `https://mcp.carbonvoice.app`
([docs](https://www.getcarbon.app/mcp/get-started-with-mcp),
[source](https://github.com/PhononX/cv-mcp-server)).

## Auth

- **OAuth 2.1 with dynamic client registration.** The server advertises
  `https://api.carbonvoice.app` as its authorization server (scopes `mcp:read`,
  `mcp:write`, PKCE S256), so Executor registers a client itself and the user
  only logs in to their Carbon Voice account. No OAuth app has to be created by
  hand. Allow Executor's redirect URI when asked.

There is no API-key option on the hosted server. (The vendor's local stdio
server takes a `CARBON_VOICE_API_KEY` that is issued on request by
devsupport@phononx.com; it is not supported here.)

## Known gaps

Carbon Voice also publishes a public OpenAPI 3.0 document at
`https://api.carbonvoice.app/docs-json` (415 paths, 474 operations; 448
operations outside `/admin`). It is not mounted; the MCP server is a deliberate
trade-off, not a proven impossibility. Reasons, all untested because no real
account was available:

- The document's `oauth2` scheme declares only an implicit flow with REST scopes
  (`channels:read`, `profile:write`, ...), while the authorization server's
  metadata advertises authorization_code + PKCE S256, refresh_token and dynamic
  registration (`/oauth/register`) with only `mcp:read` and `mcp:write` scopes.
  Whether tokens issued for those scopes are accepted by the REST routes is
  unknown.
- The alternative `api_key` scheme is a `pxtoken` header that users cannot
  create themselves.
- Admin/internal routes would have to be excluded.

If the scope question is settled in favor of REST, mount it with
`oauth2({ discover: "https://api.carbonvoice.app" })` alongside the MCP router.
Tool count of the MCP server depends on the server and is discovered at connect
time. Mutating tools require approval.

The icon is the official Carbon Voice app icon: the 512px App Store artwork for
[id1567782769](https://apps.apple.com/us/app/carbon-voice-talk-async/id1567782769),
compared visually against the iTunes lookup `artworkUrl512`.
