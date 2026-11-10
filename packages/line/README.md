# LINE

Covers the LINE Official Account Messaging API: push, reply, multicast, narrowcast and broadcast messages, rich menus and aliases, webhook endpoint, user and group info, coupons, message quotas and delivery counts, insight statistics (followers, demographics, delivery), audience groups for narrowcast, and LIFF apps.

Interface: OpenAPI. These are LINE's official specs, published at https://github.com/line/line-openapi (`messaging-api.yml`, `insight.yml`, `manage-audience.yml`, `liff.yml`), mounted under the keys `messaging`, `insight`, `audience` and `liff` in one router (91 tools). The specs are pinned to line-openapi commit `fa5577c9ea874d2dbd8fadc85a4cb3a1b29d8cbe` (2026-09-29). Mutations require approval. The seven `validate*` endpoints (validateReply, validatePush, validateMulticast, validateNarrowcast, validateBroadcast, validateRichMenuObject, validateRichMenuBatchRequest) are POSTs that only validate a payload and send nothing, so they are intentionally unapproved.

Auth: one method, a channel access token (`secrets`). Create it in the LINE Developers Console (https://developers.line.biz/console/) under your Messaging API channel, Messaging API tab, "Channel access token (long-lived)" and issue it. LINE offers no OAuth flow for the Messaging API (LINE Login OAuth only returns end-user profiles), so there is no `oauth2` method. Any valid channel access token works: long-lived tokens from the console, or channel access tokens v2.1 (expiry up to 30 days, minted by JWT assertion at `POST https://api.line.me/oauth2/v2.1/token`) and stateless tokens, which expire and must be replaced when they do. LINE MINI App channels cannot use long-lived tokens and need a short-lived or stateless one.

Known gaps:
- Operations served from `api-data.line.me` are skipped (multiple hosts): message content download, rich menu image upload and download, and audience upload by file.
- The `channel-access-token` (issuing tokens from the channel secret) and partner-only `shop` specs are not included.
