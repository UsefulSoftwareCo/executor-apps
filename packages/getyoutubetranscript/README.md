# GetYouTubeTranscript

GetYouTubeTranscript fetches YouTube transcripts in any caption language the video has. This
package covers transcripts (plain text or timestamped segments) and the list of available caption
languages, YouTube search, channel handle resolution, a channel's latest videos, videos, playlists,
posts, banner and in-channel search, playlist videos, related videos and dislike estimates, async
batch transcript jobs, and the account's credit balance.

**Interface:** OpenAPI, GetYouTubeTranscript's official 3.0 document at
https://getyoutubetranscript.com/openapi.json (18 operations). The official remote MCP server
(https://getyoutubetranscript.com/api/mcp) exposes 13 tools and takes the same API key, so the
OpenAPI document was preferred for coverage.

**Auth:** API key, sent as `x-api-key` (the API also accepts `Authorization: Bearer`). Create one
at https://getyoutubetranscript.com/developers; keys start with `sk_live_`. There is no OAuth.
The account check calls `GET /credits`, which spends no credits.

**Gaps:** Calls spend credits: 1 per successful call (a transcript with or without timestamps, or
one page of search, channel or playlist results), and a batch charges 1 per video that returns a
transcript; failed requests are not charged and `GET /credits` is free. Batch jobs return a job id
that you poll with the get-batch tool. Transcripts come from the captions a video already has, so a video with
captions turned off returns no transcript. The two `/signup` operations (email code sign-up) need
no key and are mutations, so they require approval.

**Icon:** GetYouTubeTranscript's app icon (https://getyoutubetranscript.com/images/logo.png),
resized to 256px; the vendor publishes no SVG mark.
