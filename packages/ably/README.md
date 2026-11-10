# Ably

Realtime messaging with Ably. The `api` group covers the data-plane REST API (publish and read channel messages and history, presence, channel metadata, push notification registration and publishing, batch operations, stats, token requests). The `control` group covers the Control API for managing accounts, apps, API keys, namespaces, queues and integration rules.

## Interface

OpenAPI, from Ably's official definitions in [ably/open-specs](https://github.com/ably/open-specs):

- `api`: [platform-v1.yaml](https://raw.githubusercontent.com/ably/open-specs/main/definitions/platform-v1.yaml), host `rest.ably.io`
- `control`: [control-v1.yaml](https://raw.githubusercontent.com/ably/open-specs/main/definitions/control-v1.yaml) (bundled as control.json, converted to JSON unchanged because the generator rejects the raw YAML), host `control.ably.net`

## Auth

Two accounts, one per group. Connect whichever you need.

- Ably (`api`): an API key, entered as two fields. Ably keys look like `appId.keyId:secret`; the key name is the part before the colon and the secret the part after. Create one in the Ably dashboard under your app, API Keys. The key's capabilities limit which tools work. A key without the `stats` capability still connects: the health check treats only a 401 as a rejected key and accepts 403 as authenticated.
- Ably Control API (`control`): an access token. Create it in the Ably dashboard under Account, My Access Tokens, with the capabilities for the resources you want to manage.

Neither uses OAuth, so there is no redirect URI to register.

## Known gaps

- The SSE streaming API and realtime (WebSocket) protocol are not exposed.
- Ably Token and JWT authentication for the data plane are not offered; use an API key.
