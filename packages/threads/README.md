# Threads

Threads by Meta: publish text, image, video and carousel posts, replies and
quotes, read profiles, posts, mentions and conversations, search public posts
by keyword or topic tag, moderate replies (hide, approve pending), and pull
account and post insights.

Interface: hand-written tools (24) over the Threads API,
`https://graph.threads.net/v1.0`
(https://developers.facebook.com/documentation/threads). Meta publishes no
official OpenAPI document for it. Every mutation asks for approval.

Auth:

- Access token (`token`): create an app in the Meta developer dashboard with
  the Threads use case, add the Threads account as a tester (or an app user),
  and generate a user access token. Request the permissions you need:
  `threads_basic`, `threads_content_publish`, `threads_read_replies`,
  `threads_manage_replies`, `threads_manage_insights`, plus keyword search and
  mentions permissions where offered. Long-lived tokens last 60 days and must be
  refreshed (`GET https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token`)
  before expiry; this package does not refresh them.

OAuth is not offered: the authorization-code exchange returns a short-lived
token (about 1 hour) with no refresh token, and the long-lived exchange and
renewal pass the token as a query parameter rather than a standard
refresh-token grant, which the framework cannot perform.

Known gaps: oEmbed, webhooks, the debug-token endpoint and polls, text
attachments and GIF attachments in post creation are not covered. App Review is
required for accounts that are not testers of the app.
