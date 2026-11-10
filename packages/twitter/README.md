# X (Twitter)

Posts, users, timelines, search, lists, bookmarks, likes, follows, mutes, blocks, direct messages, Spaces, Broadcasts, media and usage endpoints of the X (Twitter) API v2: 224 tools, 113 of them mutations (each requires approval).

Interface: OpenAPI, X's official document at https://api.x.com/2/openapi.json. All operations share the `https://api.x.com` origin; none are skipped.

## Auth

- **OAuth 2.0 (user context)**: create a project and app in the X Developer Console (https://console.x.com), enable OAuth 2.0 with a confidential client, and add the Executor callback shown on the connect page as the redirect URI. Paste the client ID and secret. Authorization is `https://x.com/i/oauth2/authorize`, tokens at `https://api.x.com/2/oauth2/token` (client secret via HTTP Basic). Scopes cover read and write for posts, users, follows, likes, lists, blocks, mutes, bookmarks, DMs, media, Spaces and Broadcasts, plus `offline.access` for refresh tokens.
- **App-only bearer token**: copy the Bearer Token from the app's Keys and tokens page. Works for public read endpoints only; user-context operations will be rejected.

## Known gaps

- Broadcast operations need the `broadcast.read` and `broadcast.write` scopes, which are requested; the X app must be allowed to grant them or those calls return 403.
- `GET`/`POST /2/account` need `developer.read`/`developer.write`. These are not requested (not confirmed available to standard apps), so those 2 operations are unreachable under OAuth.
- The bearer-token health check probes `GET /2/users/by/username/X`, so an invalid token is rejected; it still shows no user identity.

- OAuth 1.0a user tokens are not offered.
- Access to many endpoints depends on the X API plan (pay-per-use or tier); calls may return 403 on lower plans.
- Simple Icons has only the current X mark, which is used as the icon.
