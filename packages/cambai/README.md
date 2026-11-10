# CAMB.AI

Covers the CAMB.AI API: text-to-speech (including streaming and translated TTS), voice listing, cloning and text-to-voice, dubbing, transcription, translation, subtitles, stories, audio separation, text-to-sound, dictionaries, folders and flows.

Interface: OpenAPI, from CAMB.AI's own published document at https://docs.camb.ai/api-reference/endpoint/openapi.json (server `https://client.camb.ai/apis`). The compiled package exposes 80 tools; mutations require approval.

Auth: API key only. CAMB.AI does not offer OAuth. Create a key in CAMB.AI Studio (https://studio.camb.ai) under Settings -> API Keys (see the [direct API tutorial](https://docs.camb.ai/tutorials/direct-api) and [Authentication](https://docs.camb.ai/getting-started/authentication)); it is sent in the `x-api-key` header to `client.camb.ai`.

Known gaps: the WebSocket endpoints (live TTS, realtime speech-to-speech, live transcription) cannot be used through OpenAPI tools. The live-TTS WebSocket handshake (`GET /live-tts/ws`) is exposed as a tool, but the session protocol that follows is not usable through it. The deprecated streaming endpoint `POST /translation/stream` (text/event-stream) is not exposed as a tool; use `POST /translation` instead. Audio-producing endpoints return binary data. The spec's title is the generic "FastAPI"; the icon is CAMB.AI's official 192px app icon (no SVG mark is published).
