# Vibe

Vibe (vibe.co) is a streaming TV advertising platform. This package exposes the Vibe Public API (revision 2026-06-01): accounts, advertisers, audiences and audience syncs, campaigns, strategies, creatives, the targeting catalog (channels, devices, geo, ages, genders, demographics, interests), billing and reports. 53 tools, 24 of them mutations, which all require approval (including POST /reports and /reports/purchases, which are read-only queries sent as POST).

**Interface:** OpenAPI. Vibe's developer hub (https://developers.vibe.co) publishes the definition through its ReadMe API registry: https://dash.readme.com/api/v1/api-registry/zzgkl994mu1rv647 (listed in the hub's `apiRegistries`). The definition does not declare the required `X-Vibe-Revision` header, so the package adds it to every operation and sends `2026-06-01`.

**Auth:** both methods use apps created in the Vibe Developer tool (My Applications), which issue a client id and secret.
- `oauth`: OAuth 2.0 authorization code with PKCE, discovered from https://api.vibe.co/.well-known/openid-configuration. Select OAuth as the app's authentication method, register Executor's redirect URI exactly, and choose the scopes you need. Access tokens last 30 minutes; the package requests `offline_access` (listed in Vibe's OIDC `scopes_supported`) to obtain refresh tokens; the refresh token lifetime is not verified in the docs.
- `serverToServer`: OAuth 2.0 client credentials (token endpoint https://api.vibe.co/oauth2/token, HTTP Basic client auth) for backends acting on the app owner's own account.

Scopes requested (oauth also requests offline_access): account:read, advertisers:read/write, audiences:read/write, billing:read, campaigns:read/write, campaigns:publish, creatives:read/write, reporting:read. Scope changes require editing the app and resubmitting for review.

**Known gaps:** create and update account (POST and PATCH /accounts) are omitted because they require the account:write admin scope. the registry URL is a ReadMe identifier and could change when the hub is rebuilt. Presigned CSV and video uploads (audience sync upload, creative upload) return upload targets, but the multipart upload itself is not a tool. Embedded apps must pass `account_id`. Publishing a campaign or activating a campaign or strategy can begin paid delivery and spend.
