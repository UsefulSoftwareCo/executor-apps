# Jam

Read and manage Jam bug reports (recordings, screenshots, console logs, network requests, device context and comments) from Executor.

Interface: Jam's official remote MCP server at https://mcp.jam.dev/mcp (no public OpenAPI or GraphQL API exists). Tools are discovered from the server; any tool not marked read-only requires approval.

Auth: two methods.
- Personal access token (`secrets`): create one at https://jam.dev/s/settings/mcp under Personal Access Tokens (tokens start with `jam_pat_`, are workspace-scoped and expire). Choose `mcp:read` and/or `mcp:write`; read-only tokens cannot run the mutating tools. Sent as `Authorization: Bearer`. See https://jam.dev/docs/personal-access-tokens.md.
- OAuth 2.0 (`oauth2`): the server publishes OAuth metadata and dynamic client registration (https://api.jam.dev/oauth/register), so Executor registers its own client; no OAuth app needs to be created by hand. Scopes: `mcp:read mcp:write`. The redirect URI is Executor's own callback shown on the connect screen.

Icon: Jam's official ghost mark, the SVG at https://framerusercontent.com/images/3zAY5a6TukbdTWkNAkTDO1Yqpc.svg (used on https://jam.dev).

Known gaps: the tool list is discovered from the server and was not live-enumerated (no authenticated account was connected). Jam's MCP docs (https://jam.dev/docs/jam-mcp.md) list 31 tools: 17 read-only and 14 mutating. The video-only tools and `getScreenshots` do not work on Instant Replay Jams.
