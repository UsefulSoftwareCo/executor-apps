# Mistral AI

Covers the Mistral AI platform (La Plateforme): chat completions, FIM, agents, conversations, embeddings, classifiers, moderation, OCR, audio transcription and speech, files, fine-tuning, batch jobs, libraries, models and prompts.

Interface: OpenAPI, generated live from Mistral's official description at https://docs.mistral.ai/openapi.yaml (245 tools; every mutation requires approval). Streaming-capable operations (chat completions, FIM, speech, workflow streams) are included and return the non-streaming response; a small patch list in `openapi.ts` removes their `text/event-stream` media type, which the generator would otherwise use to drop the operation. Connector paths, which the spec keys with `#id` / `#idOrName` suffixes, are re-keyed by patch.

Auth: API key only. Mistral offers no user-created OAuth apps. Create a key in the Mistral console (https://console.mistral.ai/api-keys); it is sent as a bearer token to api.mistral.ai.

Known gaps: the four server-sent-event duplicate operations (`POST /v1/conversations#stream`, `/v1/conversations/{id}#stream`, `/v1/conversations/{id}/restart#stream` and `/v1/audio/transcriptions#stream`) are removed; use the non-streaming operations instead. The workflow stream endpoints are exposed but return their response as one JSON body, not a live stream. 47 AdminApiKey-only operations and 3 dashboard operations (`/v1/users/me`, `/v1/users/me/organizations`, `/v1/users/me/workspaces`, which need the dashboard `x-api-key`) are not exposed: the user's API key is never sent to them.
