# Eranol

Video, audio and image processing on Eranol's FFmpeg API (merge, concat, trim, captions, overlays, reframe, denoise, conversions to MP4/WebM/MP3/WAV/JPG/WebP, GIF and frame extraction), AI image generation, email, and publishing or scheduling posts on X, TikTok, Instagram and YouTube. Jobs are asynchronous: poll the status tool, then fetch the result.

Interface: Eranol's official remote MCP server, `https://eranol-connector-production.up.railway.app/mcp` (47 tools, documented at https://eranol.com/documentation/claude/connector). Eranol publishes no OpenAPI document, so the MCP server is the most complete official source. Tools that are not marked read-only ask for approval.

Auth: API key only. Create one in the API Keys section of the dashboard at https://eranol.com; it is sent in the `x-api-key` header. The MCP authorization server advertises OAuth, but it is a public PKCE client that needs a pre-registered client_id (no registration endpoint, and users cannot create one), so OAuth is omitted for that reason. Actions spend credits from your Eranol balance.

Known gaps: the server does not set read-only hints, so every tool, including status checks, asks for approval. The icon is Eranol's own logo PNG at https://www.eranol.com/logo.png, which is 100px. This is an exception to the 128px minimum: Eranol publishes no official mark of 128px or more (the favicon.ico has a 256px frame, but it is a generic triangle-in-circle, not the Eranol mark, so it is not used).
