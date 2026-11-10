# Higgsfield

Generate images, videos, characters and audio, reuse earlier creations and inspect credit balances on Higgsfield's creative platform.

Interface: Higgsfield's official remote MCP server, `https://mcp.higgsfield.ai/mcp` (streamable HTTP). Setup page: https://higgsfield.ai/mcp. Every tool the server lists is exposed; tools without `readOnlyHint` require approval.

Auth: OAuth only. The server publishes protected-resource metadata (https://mcp.higgsfield.ai/.well-known/oauth-protected-resource) listing two authorization servers: `https://clerk.higgsfield.ai` (authorization-code with PKCE, dynamic client registration at `/oauth/register`, public clients allowed) and `https://fnf-device-auth.higgsfield.ai` (device code, for clients that cannot receive redirects). Executor uses `discover` and therefore the Clerk server with a registered client, so no OAuth app of your own is needed. Scopes: `openid email offline_access`. Higgsfield offers no API key for the MCP server. The metadata's client hints name only Claude clients for the PKCE flow and select the flow by client capability; whether a live Executor connect completes that redirect has not been verified (it needs a real account). If your organization allowlists connectors, add Executor's redirect URI: the connect page shows it, and on hosted Executor `accounts.connection` returns it as `redirectUri`.

Not covered: Higgsfield's separate REST API (`https://api.higgsfield.ai`, `Authorization: Key <KEY_ID>:<KEY_SECRET>`, keys from https://console.higgsfield.ai). It publishes no OpenAPI document and each model has its own request body, so it is not exposed here; the MCP server covers generation.

Notes: generations made through MCP deduct Higgsfield credits on any plan. The server requires sign-in to list tools, so the tool count is not known until an account is connected.
