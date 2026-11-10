# Inworld AI

Inworld AI voice and inference: text-to-speech (sync, async and batch), voice library, instant voice cloning and voice design, speech-to-text, OpenAI-compatible chat completions and Responses through the Inworld router, moderation, decisions, video generation, model listing, routers and usage records.

**Interface:** hand-written tools over the documented REST API at `https://api.inworld.ai` (docs index https://docs.inworld.ai/llms.txt). Inworld publishes no OpenAPI document and no hosted remote MCP server (its `inworld mcp` is a local stdio server inside the CLI), so the documented JSON endpoints are wrapped directly. Complex request bodies are passed through as `body`; each tool description lists the fields. Streaming and WebSocket endpoints (streaming TTS, realtime, streaming STT) are not exposed. All mutations, including billed generation calls, require approval.

**Auth:** API key. Create a workspace API key in Inworld Portal (https://platform.inworld.ai) or with `inworld workspace add-key`, and paste the Base64 credential exactly as shown (it is `base64(key_id:secret)`; do not encode it again). It is sent as `Authorization: Basic <credential>`. Router write endpoints need a key with Router write permission. Inworld has no user-created OAuth apps.

**Icon:** the Inworld mark from the vendor's docs site (`https://docs.inworld.ai/logo/light.svg`); not in Simple Icons.

**Known gaps:** no streaming or WebSocket tools; PVC upload, train and trim endpoints and the TTS voice preview are not wrapped; audio results are returned as base64 JSON. The health check lists TTS voices.
