# TikTok

TikTok for a creator's own account through TikTok's Display API and Content Posting API (open.tiktokapis.com/v2): profile and stats, list and query the user's videos, read the creator's posting options, publish a video or photo post from a URL, send a draft to the TikTok inbox and check publish status. Reads run freely; every publish asks for approval. For TikTok advertising use the `tiktokads` package.

**Interface:** hand-written tools over TikTok's official REST API; TikTok publishes no OpenAPI document, official MCP server or GraphQL API. Docs: https://developers.tiktok.com/doc/overview. `api.get` and `api.post` reach other v2 paths.

**Auth:** user access token, sent as a Bearer token. Register an app at https://developers.tiktok.com/apps, add the Login Kit, Display API and Content Posting API products, request the scopes `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list`, `video.publish` and `video.upload` as needed, authorize your account, and exchange the code for a token (`POST https://open.tiktokapis.com/v2/oauth/token/`). Paste the access token into the connect page. In-app OAuth is not offered because TikTok's authorize and token requests use `client_key` where the framework always sends `client_id`. User access tokens last 24 hours (the refresh token a year), so reconnect with a fresh token when calls start failing with auth errors.

**Health check:** `GET /v2/user/info/?fields=open_id` (needs `user.info.basic`).

**Known gaps:** chunked binary file upload (`FILE_UPLOAD` source) is not supported, only `PULL_FROM_URL` from a domain or URL prefix verified in the developer portal; content from unaudited apps is restricted to private viewing, and `privacy_level` must come from `publish.creatorInfo`; Research API and Data Portability need separate approval and are reachable only through `api`. Nothing was exercised against a live account.
