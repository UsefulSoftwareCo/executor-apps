# Facebook

Facebook Pages through the Meta Graph API (v25.0): list managed Pages, read and publish or schedule posts, upload photos and videos, moderate comments, read and give reactions, fetch Page and post insights, and run Messenger conversations. Personal profiles and groups are not exposed by the Graph API and are not covered.

**Interface:** hand-written tools over the Graph API (`https://graph.facebook.com/v25.0`). Meta publishes no OpenAPI document or official remote MCP server, so there is no spec to generate from (docs: https://developers.facebook.com/docs/graph-api and https://developers.facebook.com/docs/pages-api). 41 tools (18 of them mutations, which always require approval). Page-scoped tools take a `pageId`; the Page access token is looked up automatically from the user or system user token.

## Auth

- **Access token (`token`)**: a user, system user or Page access token. Create one in the Meta app dashboard (https://developers.facebook.com/apps), via a system user in Business Settings, or the Graph API Explorer. It needs the Pages permissions for the tools you use.
- **OAuth (`oauth`)**: Facebook Login with your own Meta app. Create an app at https://developers.facebook.com/apps, add Facebook Login, and paste the App ID and App Secret. Add the Executor redirect URI shown on the connect page to "Valid OAuth Redirect URIs". Scopes requested: `public_profile`, `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`, `pages_manage_posts`, `pages_manage_engagement`, `pages_manage_metadata`, `pages_messaging`, `read_insights`.

## Caveats

- **OAuth tokens are short-lived.** Facebook Login returns a short-lived user token (about an hour or two). Executor's OAuth config has no hook for exchanging it for a long-lived token (`grant_type=fb_exchange_token`, about 60 days), so an OAuth-connected account stops working once the token expires and must be reconnected. For durable use, connect with the `token` method using a system user token (Business Settings > System users), which does not expire.
- **`read_insights` scope is unconfirmed in Live mode.** Meta's permissions reference still lists `read_insights`, but one community report (gitroomhq/postiz-app#1346, Graph v20.0) says the login dialog rejected it as "Invalid Scopes" for a Live-mode app. Check it in your Meta App Dashboard before relying on OAuth; if rejected, use the `token` method.
- **Insights metrics change.** Meta deprecated many Page Insights metrics (for example `page_impressions_unique`, `post_impressions`, `page_fans`) and returns an invalid metric error for them. The tool descriptions suggest current ones such as `page_media_view`, `page_total_media_view_unique`, `page_follows`, `page_post_engagements`, `page_views_total` and `post_clicks`; see Meta's Insights reference for the current list.
- **Page tokens.** Page tools look up the Page token from the connected user's token; if the user has no role on the Page, the tool fails with a clear error rather than falling back to the user token.

## Known gaps

Most Pages permissions need Meta App Review and Business Verification before they work for users who are not app roles. Ads, groups, events, and uploading video from local files (only public URLs) are not covered.
