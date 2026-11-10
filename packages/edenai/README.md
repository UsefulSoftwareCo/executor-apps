# Eden AI

Runs Eden AI's models across many AI providers through one account: chat, responses, embeddings, images, speech, transcription, video, web search and moderation through the REST API, plus expert-model tools (OCR and document parsers, face and deepfake detection, anonymization, plagiarism, spell check, NER, topic extraction, background removal, logo and object detection, translation, web crawl, scrape and research) through Eden AI's MCP server.

**Interface:** two sources under one router.
- `api`: Eden AI's official OpenAPI 3.1 document, https://api.edenai.run/v3/docs/openapi.json (50 operations, server `https://api.edenai.run`, HTTP bearer auth). Mutations require approval.
- `mcp`: Eden AI's official remote MCP server, https://mcp.edenai.run/mcp (Streamable HTTP, `Authorization: Bearer <key>`, no OAuth). Of its 42 tools, 9 that duplicate a spec operation are hidden so one is kept: `list_models`, `list_voices`, `manage_collections`, `audio_speech_to_text`, `audio_tts`, `image_generation`, `video_generation`, `text_moderation`, `web_search`. The remaining 33 are exposed. None of them set `readOnlyHint`, so every MCP tool asks for approval, including read-only ones such as `check_job`.

**Auth:** API key only, sent as `Authorization: Bearer <key>` to both hosts. Create an inference key (`sk-eden-...`) as described at https://www.edenai.co/docs/v3/general/custom-api-keys.md.

**Health check:** the account check calls `GET https://api.edenai.run/v3/models` with the key. The REST API answers a bogus Bearer key with 401 there (checked with a fake key, no real credentials used), so a failure means the key is refused. The success path with a real key has not been exercised. The MCP server cannot be used for this: it answers `initialize` and `tools/list` identically with no key and with a bogus key, so the framework's `mcpHealth` always reports the credentials as unverified.

**Gaps:** the management API (https://api.edenai.run/v2/info/splitted-schema/management_api/openapi.json, 12 paths) needs a separate management key (`ManagementKeyAuth`; inference keys are not accepted) and is not mounted.
