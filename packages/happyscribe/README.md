# Happy Scribe

Order machine or human transcription, subtitles and translation with Happy Scribe, export transcripts in 20+ formats, send the meeting notetaker bot to Zoom, Google Meet and Microsoft Teams calls, and manage glossaries, style guides and workspace members. 23 tools.

**Interface:** hand-written tools over the Product API, `https://www.happyscribe.com/api/v1`, documented at https://dev.happyscribe.com/sections/product/. Happy Scribe publishes no OpenAPI document, so the tools follow the docs by hand. The deprecated `POST /transcriptions` endpoint is left out in favour of orders; the deprecated translation tasks are kept because they are still served.

**Auth:** two methods. API key (`apiKey`) for the 23 REST tools. Copy it from the Account page after logging in to Happy Scribe. It is sent as `Authorization: Bearer <key>` to `www.happyscribe.com`. 

**MCP (OAuth):** Happy Scribe's official remote MCP server, `https://www.happyscribe.com/mcp`, is mounted under the `mcp` key for accounts connected with `oauth`. It uses OAuth 2.0 with dynamic client registration (metadata discovered from `https://www.happyscribe.com`), so no OAuth app needs to be created by hand. It adds search across transcripts, quotes with timestamps, cross-transcript analysis, the people and companies knowledge graph, and help-doc search. OAuth applies only to the MCP endpoint; the REST API accepts only the personal API key. An `oauth` account exposes only the MCP tools and an `apiKey` account only the REST tools. MCP tools other than read-only ones ask for approval.

**Notes and gaps:**

- Most tools need an organization (workspace) id; call `organizations.list` first.
- Orders with `confirm: true` start work and billing at once, so every mutation asks for approval.
- Happy Scribe limits the transcription creation endpoint (`POST /orders` here) to 200 requests per hour by default. Over the limit it answers 429 with a `retry_in_seconds` field in the body; no rate-limit headers are documented.
- Uploading a local file is two steps: `uploads.signedUrl`, then PUT the bytes to the signed URL outside Executor, then use that URL as the order `url`.
- The Intelligence API (companies and people) is private beta and not included.
