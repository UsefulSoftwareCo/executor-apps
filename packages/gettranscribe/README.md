# GetTranscribe

Transcribe Instagram, TikTok, YouTube, Facebook, X, Pinterest, Google Drive and direct media links with [GetTranscribe](https://www.gettranscribe.ai). The package covers async transcription jobs, finished transcripts, folders, download-link resolution and account usage (11 tools).

**Interface:** hand-written tools over the REST API at `https://api.gettranscribe.ai`, following the [official API docs](https://www.gettranscribe.ai/api-documentation/documentation) and the vendor's agent skill file. GetTranscribe publishes no OpenAPI document. It does host an official remote MCP server at `https://mcp.gettranscribe.ai/mcp` (OAuth 2.1 consent flow where you enter a `gtr_` key; documented at https://www.gettranscribe.ai/integrations/claude), but it exposes only 6 tools (create, get and list transcription; create, get and list folder). This package uses REST instead because it covers more: 11 tools including jobs, folder updates, download-URL resolution and account usage. The MCP server is an alternative if you only need those 6. Creating transcriptions goes through the async jobs endpoints, as the vendor recommends.

**Auth:** API key only (sent as `x-api-key`). Create a permanent key at https://www.gettranscribe.ai/api-documentation/authentication after signing in. No OAuth. Paste a `gt_` key (the REST key format, per the vendor's REST docs and agent skill file). The `gtr_` key format belongs to the MCP flow and is not the REST key. Auth is verified against vendor docs only.

Mutations (creating jobs, creating or updating folders, resolving download URLs) require approval because they spend credits or change data.

**Known gaps:** the API-key creation endpoint is not exposed. The account tool needs your own user id, which appears as `user_id` on every job. Transcript word and segment timing arrays are returned as the API provides them.

The icon is the GetTranscribe app icon from its App Store listing (512px); the site's own icon.svg is only a generic microphone glyph.
