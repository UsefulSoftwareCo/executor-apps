# YouTube Transcript

YouTubeTranscript.dev: fetch and store YouTube transcripts (captions, with
optional AI speech recognition), single-video and batch transcription, job and
batch status, stored transcripts and their languages, translation, file
uploads, credit balance, playlist and channel resolution, and YouTube
video/short/channel/playlist search.

**Interface:** OpenAPI, the vendor's official V2 document at
https://www.youtubetranscript.dev/api/v2/openapi.json (26 operations, 26 tools).
Docs: https://www.youtubetranscript.dev/api-docs.

**Auth:** API key sent as `Authorization: Bearer yt_sk_live_...`. Create one in
the YouTubeTranscript.dev dashboard. API access is listed only on the Basic
plan ($9/mo) and above in the vendor's pricing; the Free plan may not issue
keys (verify in the dashboard). The vendor offers no OAuth, so no `oauth2`
method is declared. The health check calls `GET /credits` and only requires a 2xx JSON response
(the vendor does not guarantee any field in it).

**Icon:** the vendor's official logo (https://www.youtubetranscript.dev/logo.svg).

**Gaps:** API keys need a paid plan (Basic or higher). File upload is
incomplete: `createUpload` returns a signed URL that must be PUT to outside
this tool set (that host is not in `hosts` and no tool performs the PUT)
before `completeUpload`. The vendor's docs link an official MCP server at
https://github.com/youtubetranscript/mcp, but that repo returns 404 (checked
2026-10-12), so it could not be compared; recheck later. Calls spend credits; playlist and channel resolution need a paid
tier. Not affiliated with YouTube or Google.
