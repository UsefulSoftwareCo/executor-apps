# Tumblr

Blogs, posts (Neue Post Format create, reblog, edit, delete), queue, drafts, submissions, followers, following, likes, notifications, blocks and tag search through the Tumblr API v2.

**Interface:** hand-written tools over `https://api.tumblr.com/v2`. Tumblr publishes no OpenAPI document, so the 31 tools cover the documented endpoints at https://www.tumblr.com/docs/en/api/v2. Every mutation requires approval.

**Auth:** OAuth 2.0 only (authorization code, scopes `basic write offline_access`; the refresh token is issued only with `offline_access`). Register an application at https://www.tumblr.com/oauth/apps and add the redirect URI shown on the Executor connect page as the application's OAuth2 redirect URL, then enter the consumer key and secret as the client id and secret.

**Gaps:** communities endpoints, pages, filtered content, mute and the legacy (non-NPF) post endpoints are not exposed. Media upload by multipart is not supported; use image URLs in NPF blocks. Rate limits are per consumer key (1,000/hour, 5,000/day).
