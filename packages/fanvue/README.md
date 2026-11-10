# Fanvue

Fanvue creator platform: profile, chats and messages, posts, the media vault, subscribers and followers, insights and earnings, tracking links, webhooks, fan experiences and agency team management.

**Interface:** OpenAPI, from Fanvue's official OpenAPI 3.1 document at https://api.fanvue.com/docs/openapi.json (265 operations, none skipped; 126 mutations, all requiring approval). Requests go to `https://api.fanvue.com`. The spec marks the `X-Fanvue-API-Version` header as required on every operation; the package fills it with `2025-06-26` (the spec's default) on every tool call and on the health check, and callers may override it per call.

**Auth:** OAuth 2.0 authorization code only. Fanvue has no API keys. Create an app in the Fanvue Developer Area (https://api.fanvue.com/docs/get-started/build-your-first-app), copy its Client ID and Client Secret, and register Executor's redirect URI shown on the connect page as one of the app's redirect URIs. Every Fanvue app is a confidential client (token exchange uses HTTP Basic client authentication, PKCE is required). Endpoints come from OIDC discovery at https://auth.fanvue.com. The package requests `offline_access` plus every non-agency API scope; consent drops scopes the account type cannot grant (fan accounts get only self, chat, media and experience scopes).

**Known gaps:** the agency admin scopes `read:agency` and `write:agency` are not requested, so agency team and invite endpoints fail until those scopes are added. Creator-only endpoints need a creator or agency account.
