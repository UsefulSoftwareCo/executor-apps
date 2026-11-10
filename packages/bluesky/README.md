# Bluesky

Bluesky and the AT Protocol: read feeds, profiles and threads, post, like, repost, follow, block, manage lists and feed generators, send chat messages, and run repo, identity and moderation (Ozone) calls. 235 tools.

## Interface

OpenAPI, from Bluesky's official endpoint reference (generated from the lexicons by bluesky-social/endpoints-standalone), mounted as three keys in one router:

- `app`: https://endpoints.bsky.app/openapi.bluesky-app.json (`app.bsky.*` and `com.atproto.*`, 152 tools)
- `chat`: https://endpoints.bsky.app/openapi.bluesky-dms.json (`chat.bsky.*`, 38 tools)
- `ozone`: https://endpoints.bsky.app/openapi.ozone-moderation.json (`tools.ozone.*`, 45 tools)

Every mutation requires approval.

## Auth

App password. In Bluesky, open Settings, Privacy and security, App passwords (https://bsky.app/settings/app-passwords), create one, and give Executor your handle (for example `you.bsky.social`) plus that app password. Executor exchanges it for a short-lived access token with `com.atproto.server.createSession` and attaches it to each request. Tick "Allow access to your direct messages" on the app password if you want the `chat` tools to work.

AT Protocol OAuth is not offered: it requires DPoP-bound tokens and a client metadata document hosted at the client's own URL, which Executor's OAuth flow does not support.

## Known gaps

- Requests go to `https://bsky.social`, which proxies `app.bsky`, `chat.bsky` and `tools.ozone` to the right service. Accounts hosted on a self-run PDS are not supported.
- The relay-only `com.atproto.sync.*` calls are served by `bsky.network`, not the PDS, so most of them do not work here; the account's own repo sync calls on the PDS do.
- Streaming endpoints (Jetstream, firehose subscriptions) are not exposed.
