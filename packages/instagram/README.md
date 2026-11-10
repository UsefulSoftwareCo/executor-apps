# Instagram

Instagram professional (Business and Creator) accounts: profile and account
insights, media and stories, publishing photos, reels, stories and carousels,
comments (read, post, reply, hide, delete, private reply), and direct messages.
Personal accounts are not supported by Instagram's API.

Interface: hand-written tools (29) over the Instagram API with Instagram Login,
`https://graph.instagram.com/v25.0`
(https://developers.facebook.com/docs/instagram-platform). Meta publishes no
official OpenAPI document for it; the only spec on integrations.sh
(APIs.guru, `instagram.com/1.0.0`) describes the retired v1 API, so it was not
used. Every mutation asks for approval.

Auth:

- Access token (`token`): in the Meta app dashboard, open the app's Instagram
  product, "API setup with Instagram login", add the professional account and
  generate a token. Long-lived tokens last 60 days and must be refreshed
  (`GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token`)
  before expiry; this package does not refresh them (the `ig_refresh_token` renewal works only for long-lived tokens).

OAuth is not offered: Instagram's code exchange returns a short-lived token (about 1 hour) inside a `data` array, and the long-lived exchange and `ig_refresh_token` renewal pass the access token as a query parameter rather than a standard refresh-token grant, which the framework cannot perform.

Known gaps: Facebook Login for Business flows (graph.facebook.com), hashtag
search, business discovery, mentions webhooks, and the legacy Basic Display API
(retired) are not covered. App Review is required for other users' accounts.
