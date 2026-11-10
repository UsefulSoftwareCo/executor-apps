# CometAPI

CometAPI is a unified gateway to text, image, audio and video models from many providers behind one OpenAI-compatible API. This package mounts 147 of the 154 official per-operation OpenAPI documents: model listing, chat completions, Responses, embeddings, moderation, current-key usage, speech/transcription/translation, Gemini native generateContent, and image, video, music and 3D generation with task polling across providers (OpenAI, Grok, Gemini, Seedream, FLUX, Replicate, Midjourney, Bria, Sora 2, Veo 3, Seedance, Kling, Runway, Suno, Vidu, Wan, MiniMax, Hunyuan 3D and more).

Interface: OpenAPI. CometAPI publishes one official OpenAPI document per operation at `https://apidoc.cometapi.com/api/openapi/<path>.openapi.json` (index: https://apidoc.cometapi.com/llms.txt, "OpenAPI Specs" section). `openapi.ts` lists the document paths and `index.ts` mounts each under its own key (camelCased path) in one router, with one provider and the base URL `https://api.cometapi.com`.

Auth: API key. Create one in the CometAPI console at https://www.cometapi.com/console/token. It is sent as a Bearer token, and as `x-goog-api-key` for the Gemini generateContent document, which declares that header scheme (CometAPI accepts the same key either way). No OAuth is offered.

Known gaps (7 of 154 documents):
- The five API key management documents (`/api/token/`) need a separate console personal access token sent raw in `Authorization`, not the API key, so they are not mounted.
- OpenAI image generations (`/v1/images/generations`) and Anthropic Messages (`/v1/messages`) are not mounted: their only operation can respond with `text/event-stream`, which a tool cannot return. Use chat completions for Claude models and the other image routes (Grok, Gemini, Seedream, FLUX...) for images.
