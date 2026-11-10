# ElevenLabs

Text to speech, speech to text, voices and voice cloning, dubbing, sound effects, music, pronunciation dictionaries, conversational AI agents, knowledge bases, Studio projects, history and workspace management.

**Interface:** OpenAPI, ElevenLabs' official document at https://api.elevenlabs.io/openapi.json (413 tools). The document declares no security scheme (each operation takes an optional `xi-api-key` header parameter), so `openapi.ts` patches in a global `xi-api-key` apiKey scheme and the account's key is sent on every call. Requests go to `api.elevenlabs.io` only.

**Auth:** API key (`apiKey`). Create one under Settings > API Keys at https://elevenlabs.io/app/settings/api-keys; keys can be scoped to specific endpoints, and a restricted key only works for the tools its scopes cover. ElevenLabs offers no OAuth for third-party apps.

**Approvals:** every mutation (POST/PUT/PATCH/DELETE, including audio generation, which consumes credits) requires approval.

**Known gaps:** `POST /v1/music/detailed/stream` (`compose_detailed_stream`) responds with `text/event-stream`, which a tool cannot return, so the framework leaves it out (it is not counted in the skipped list); `POST /v1/music/detailed` covers the same generation without streaming. Binary audio endpoints return raw bytes as the framework allows. Websocket endpoints (realtime TTS/STT, agent conversations) are not in the OpenAPI document and are not covered. `GET /docs`, a redirect to the documentation website, is removed. The per-operation `xi-api-key` header parameter is removed from every operation (`header-patches.json`, regenerated from the live document: each affected operation's parameter list without that header), so the account's key is the only one sent; if the document adds new operations they keep the optional header until the file is regenerated. Data-residency hosts (`api.us.elevenlabs.io`, `api.eu.residency.elevenlabs.io`, `api.in.residency.elevenlabs.io`) are not supported; only `api.elevenlabs.io` receives credentials. The health check calls `GET /v1/user`, which needs the key's user read scope.
