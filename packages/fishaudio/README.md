# Fish Audio

Text-to-speech, speech-to-text, voice models (cloning), voice design, wallet credit and the voice-agent platform (agents, sessions, tools, knowledge sources, tests, phone numbers) on Fish Audio.

Interface: OpenAPI, Fish Audio's official document at https://docs.fish.audio/api-reference/openapi.json (59 tools, mutations require approval).

Auth: API key only. Create one at https://fish.audio/app/api-keys/ ; it is sent as a Bearer token to `api.fish.audio`. Fish Audio offers no user-created OAuth apps.

Known gaps: the real-time WebSocket TTS endpoint (AsyncAPI) is not exposed; `/v1/tts/live/with-timestamp` and streaming endpoints return audio or event streams that may not be useful as tool output.
