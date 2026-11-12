# YouTube

Videos, channels, playlists and playlist items, comments and comment threads, captions, subscriptions,
search, live broadcasts and streams, channel sections, memberships, watermarks, playlist images and more
via the YouTube Data API v3 (77 operations; 49 mutations require approval).

**Interface:** OpenAPI, converted from Google's own YouTube Data API v3 Discovery document (`https://youtube.googleapis.com/$discovery/rest?version=v3`) by `scripts/google-discovery.ts` into `openapi.json`, whose `info.x-executor-discovery` records the revision. Google publishes no OpenAPI for it.
Google has no official YouTube remote MCP server. A method's JSON resource is its request body on its own
path. `thumbnails.set`, whose only body is the image, is sent with Google's simple upload protocol: pass
`uploadType: "media"`, the image as base64 and its `contentType`. Requests go to
`https://youtube.googleapis.com`.

**Auth:** two methods.

- API key: create a key in the Google Cloud console (APIs & Services, Credentials) with the YouTube Data
  API v3 enabled, and paste it into the connect page. It is sent as the `key` query parameter and only
  reads public data (search, videos, channels, playlists, playlist items, comments, comment threads,
  subscriptions, activities, channel sections, categories, regions, languages). Write operations and
  anything private are not offered for this method.
- OAuth 2.0: choose Executor for Google on Executor Cloud when offered. For a custom client (Google has no dynamic client registration), enable the
  YouTube Data API v3, configure the OAuth consent screen, and create an OAuth client ID of type "Web
  application". Add the redirect URI shown on Executor's connect page to the client's authorized redirect
  URIs, then paste the client ID and secret into the connect page. Scopes requested: `youtube` and
  `youtube.force-ssl`; the app asks for offline access so it receives a refresh token. While the consent
  screen's publishing status is "Testing", Google expires refresh tokens after 7 days, so publish the app
  or re-consent weekly.

**Known gaps:** methods that need a file sent with media upload beside their JSON resource are not
covered: `videos.insert` (upload a video), `captions.insert` (upload a caption track),
`playlistImages.insert` (add a playlist image), `channelBanners.insert` (upload a banner image) and
`watermarks.set` (upload a watermark). A tool call cannot carry metadata plus a file, so these would
only advertise an upload they cannot do. `captions.update` and `playlistImages.update` are offered
for metadata-only changes, which Google accepts without a file (for example a caption track's draft
status); replacing the file itself is not covered. `liveChat/messages/stream` is left out: it is a
server-streamed RPC that keeps its response open while the chat runs, and `liveChatMessages.list` polls
the same messages. `openapi.json` lists every left-out method and its reason in
`info.x-executor-discovery.excluded`. The separate YouTube Analytics and Reporting APIs are
not covered. YouTube Data API quota
(10,000 units/day by default) applies per Google Cloud project. Partner-only scopes are not requested.

Executor Cloud can offer its shared **Executor for Google** OAuth client when the operator has configured it and enabled these scopes. Custom OAuth clients remain available; use the callback URL shown on the connect page. Self-hosted operators configure their own client. Google project API enablement, quotas, billing and account permissions still apply.
