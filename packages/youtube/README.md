# YouTube

Videos, channels, playlists and playlist items, comments and comment threads, captions, subscriptions,
search, live broadcasts and streams, channel sections, memberships, watermarks and more via the
YouTube Data API v3 (75 operations; 50 mutations require approval).

**Interface:** OpenAPI. Google publishes the YouTube Data API only as a Discovery document and has no
official YouTube remote MCP server, so this uses APIs.guru's maintained OpenAPI conversion of Google's
official Discovery document, an unofficial conversion that drifts from the source of truth,
Google's Discovery document (https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest):
https://api.apis.guru/v2/specs/googleapis.com/youtube/v3/openapi.json. The package removes the one
operation the conversion invented (PUT commentThreads). Requests go to
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

**Known gaps:** the APIs.guru conversion lacks 8 methods that Google's Discovery document defines:
playlistImages list, insert, update and delete; videoTrainability get; videos batchGetStats;
liveChat/messages stream; and liveChat/messages transition. Video and caption file uploads (media upload
endpoints) and the separate YouTube Analytics and Reporting APIs are not covered. YouTube Data API quota
(10,000 units/day by default) applies per Google Cloud project. Partner-only scopes are not requested.

Executor Cloud can offer its shared **Executor for Google** OAuth client when the operator has configured it and enabled these scopes. Custom OAuth clients remain available; use the callback URL shown on the connect page. Self-hosted operators configure their own client. Google project API enablement, quotas, billing and account permissions still apply.
