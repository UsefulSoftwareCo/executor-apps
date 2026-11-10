# Moderation API

Content moderation with [Moderation API](https://moderationapi.com): moderate text and images, review queues, authors, actions, wordlists, webhooks, projects and channels.

Interface: OpenAPI, from the vendor's official document at https://docs.moderationapi.com/openapi.json (base URL `https://api.moderationapi.com/v1`). Every mutation requires approval.

Auth: API key sent as a bearer token. Create a project key (`sk_`) under Project > Configure > API keys in https://dash.moderationapi.com for moderation, queues, authors, actions and webhooks, or an organization key (`sk_org_`, Settings > API keys, Enterprise) for the projects and channels management endpoints. The vendor offers no OAuth.

Icon: the vendor's official app icon from https://moderationapi.com/icon.svg (Simple Icons has no entry).

Known gaps: a project key cannot call management endpoints and an organization key cannot moderate content; add one account per key type.

Not exposed: the WebSocket voice gateway (`GET /stream` on `wss://voice.moderationapi.com/v1`) is skipped because it is not a request/response operation, which is why 47 tools are generated from 48 operations. Deprecated legacy operations (`GET /auth`, `POST /auth`, `POST /actions/{actionId}/execute`) are still exposed as tools; prefer the non-deprecated equivalents. `GET /webhook-secret` creates the signing secret if none exists, so it requires approval like a mutation.
