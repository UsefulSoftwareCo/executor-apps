# Hjarni

Read and write a Hjarni Markdown knowledge base: search notes, create and edit them (including anchor-based body edits), link, move, favorite, archive, restore and revert notes, and manage folders (containers) and tags.

## Interface

OpenAPI, from Hjarni's own document at <https://hjarni.com/openapi.json> (REST API at `https://hjarni.com/api/v1`, reference at <https://hjarni.com/docs/api>). The official remote MCP server at `https://hjarni.com/mcp` (reference: <https://hjarni.com/docs/mcp>, 41 tools per the vendor docs; an unauthenticated probe only returns the OAuth challenge) is mounted under `mcp` because it adds teams, folder permissions for teammates, email capture addresses, nudges, feedback and file upload URLs, which the REST spec (46 paths) lacks. Mutating tools require approval unless the MCP marks them read-only.

## Auth

API token (Bearer). Create one in Hjarni under Settings > Connections. A token reaches only the folders it is given (No access, Read or Write per folder) unless created with "Everything I can reach"; see <https://hjarni.com/docs/api>.

OAuth: discovered from <https://hjarni.com/.well-known/oauth-authorization-server> (authorization code with PKCE S256, dynamic client registration at `/register`). OAuth tokens carry the person's full access, unlike scoped API tokens. The REST API documents OAuth tokens as accepted; this was not exercised with a real account.

## Gaps

Requests are limited to 100 per minute per account. File attachment upload is exposed as the spec describes it; attachment download URLs are signed and expire after 15 minutes.
