# Gradium

Gradium is a low-latency voice AI platform. This package exposes its REST API: one-shot text-to-speech and transcription, voice management, voice design (generate, enhance, localize, embeddings), pronunciation dictionaries and credit balance.

Interface: OpenAPI, from Gradium's official document at https://docs.gradium.ai/api-reference/openapi.json (base URL https://api.gradium.ai/api).

Auth: API key only (sent as the `x-api-key` header). Create one in the Gradium dashboard at https://gradium.ai. Gradium offers no user-created OAuth apps.

Known gaps: the WebSocket endpoints (`/speech/tts`, `/speech/asr`, `/speech/s2s`) are streaming protocols; they are removed from the tool set via spec patches. Use the POST variants instead. Gradium documents regional hosts (`eu.api.gradium.ai`, `us.api.gradium.ai`) in https://docs.gradium.ai/guides/data-residency.md, but the spec lists only `api.gradium.ai`, so EU/US-pinned sessions are not covered. Sending the key to those hosts requires adding them to `hosts` in `index.ts`. No official Gradium MCP server was found, but this was not exhaustively verified.
