# GroqCloud

Fast LLM inference on GroqCloud: chat completions, the Responses API, speech-to-text and text-to-speech, embeddings, reranking, models, files, batches and fine-tunings (23 tools).

## Interface

OpenAPI. Groq publishes no downloadable spec file, but its official API reference at https://console.groq.com/docs/api-reference is rendered from the OpenAPI 3.0 document ("GroqCloud API" 2.1), which is embedded in the page. That document is vendored as `spec.json` (extracted from the page, unmodified). Refresh it by re-extracting from that page. Requests go to `https://api.groq.com` (`/openai/v1/...` and `/v1/fine_tunings`).

## Auth

- API key: create one at https://console.groq.com/keys. Sent as `Authorization: Bearer <key>`.

Groq offers no OAuth. Mutations (including chat completions, which are POSTs) require approval.

## Known gaps

- The vendored spec is a snapshot and does not update automatically.
- File upload and audio transcription use multipart bodies; behavior depends on the framework's multipart support.
