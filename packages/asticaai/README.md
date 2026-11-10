# Astica AI

Covers astica's cognitive APIs: asticaVision (image description, OCR, objects, faces, tags, moderation), asticaListen (speech to text), asticaVoice (text to speech, voice lists), asticaDesign (image generation) and GPT-S text generation. 8 hand-written tools.

**Interface:** custom. astica publishes no OpenAPI document, so the tools are hand-written from the vendor docs (https://astica.ai/api/documentation/get-started/, plus the vision, hearing, voice, design and nlp documentation pages). Requests go to `vision.`, `listen.`, `voice.`, `design.` and `nlp.astica.ai`.

**Auth:** API key only (astica has no OAuth). Create one at https://astica.ai/api-keys/. The key is sent as `tkn` in each JSON body. The health check calls `voice_clone_list` (an invalid key returns HTTP 401).

**Approvals:** every billable call (vision, OCR, transcription, text to speech, image generation, GPT-S) is modeled as a mutation and needs approval because it consumes credits. Only the voice list, clone list and TTS task poll tools are queries without approval.

**Known gaps:** voice cloning (multipart upload) and streaming output are not exposed. Several response shapes (hearing, nlp, low-priority polling) are undocumented by astica, so results are passed through as raw JSON. Errors, whether HTTP 200 with `status: "error"` or a non-2xx response (400/401/402/403/404/429/500/503), are raised as tool errors carrying astica's message with the key redacted. Only text to speech low_priority is exposed with a polling tool; design low_priority is not exposed because astica does not document how to retrieve its result. Fields not passed are not sent, except the sample modelVersion values noted in each tool description.
