# Blooio

Send iMessage, SMS, RCS, WhatsApp and Apple Messages for Business messages through Blooio. Covers the account, channels, contacts and identities, chats, messages, reactions, polls, groups, webhooks, attachments, phone-number lookup and the unified event feed (99 tools, 54 of them mutations that require approval).

**Interface:** OpenAPI, Blooio's official v4 document at https://docs.blooio.com/openapi.json (server `https://api.blooio.com/v4`).

**Auth:** API key only. Create a key in the Blooio dashboard (https://app.blooio.com) and paste it as the API key; it is sent as `Authorization: Bearer bl_live_...`. Blooio has a "Blooio Apps" OAuth system (access tokens `blo_at_...` with scopes such as `apikeys:read`, `apikeys:manage`, `numbers:read`, `numbers:manage`), but its authorization and token endpoints and how a user creates an app are not documented in the public docs, so only the API key is offered.

**Known gaps:** The v4 spec is beta (version 4.0.0-beta) and may change. The seven `/api-keys` operations (list, create, get, deprecate, list/assign/unassign channels) are documented as callable only with a Blooio Apps OAuth token and return 403 `oauth_token_required` for API keys, so they are removed in `openapi.ts`. The older stable v2 API (https://api.blooio.com/v2/api/openapi.json) is not mounted because v4 supersedes it. The health check calls `GET /v4/me`.
