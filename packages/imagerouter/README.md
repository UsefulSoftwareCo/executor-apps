# ImageRouter

Generate images, videos and text through ImageRouter's unified OpenAI-compatible API: image generation and edits, video generation, chat completions, responses, model listing, API key validation, credit balance, and management-key API key creation.

**Interface:** OpenAPI, the vendor's official spec at https://api.imagerouter.io/.well-known/openapi.yaml (9 operations). Seven are generated from the spec under `api`; the two streaming operations are hand-written under `custom` (below). The spec has little response typing, so results come back loosely typed.

**Auth:** API key. Create one at https://imagerouter.io/api-keys. It is sent as `Authorization: Bearer <key>`. ImageRouter has no OAuth.

**Hand-written tools:** `POST /v1/openai/chat/completions` and `POST /v1/openai/responses` declare `text/event-stream` responses, which Executor's OpenAPI compiler drops (it reports them as 0 skipped). `custom.chatCompletions` and `custom.responses` call them with `stream: false`, so they return JSON; streaming is not available.

**Known gaps:** The `/v1/api-keys` operation needs a management key, which ImageRouter does not allow on any other endpoint; connect a management key as a separate account if you need it. Model discovery via the newer `GET /v3/models` is not in the official spec; `GET /v1/models` is.
