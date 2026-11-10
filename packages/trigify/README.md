# Trigify

Social listening and signal data in Trigify, through Trigify's official remote MCP server at https://api.trigify.io/mcp (the "Trigify IO (MCP)" catalog target is the same product). Tools are discovered from the server at runtime; non-read-only tools require approval.

## Auth

OAuth 2.0 with dynamic client registration. The server publishes protected-resource metadata pointing at Clerk (https://clerk.trigify.io), so no OAuth app needs to be created by hand; the user signs in to their Trigify account when connecting. The redirect URI is registered automatically by dynamic client registration. The connection requests the `offline_access` scope (supported by Clerk) so that a refresh token is issued and the connection can refresh. The server's resource metadata only lists `user:org:read`, so `openid` is not requested.

## Known gaps

The tool list was not enumerated because tools require an authenticated session. The icon is the vendor's own site icon (https://www.trigify.io/icon.svg).
