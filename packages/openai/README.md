# OpenAI

Covers the OpenAI platform API: responses, chat completions, embeddings, images, audio, files, uploads, vector stores, assistants and threads, fine-tuning, batches, evals, moderations, models, and organization administration (users, projects, API keys, usage, audit logs).

Interface: OpenAPI, from OpenAI's official description in https://github.com/openai/openai-openapi, pinned to commit `e95c0fe615f45a19e8878af923a729948445a6bd` (spec version 2.3.0, 2026-10-09) in `openapi.ts`; update the SHA to pick up changes. Server `https://api.openai.com/v1`. 351 tools, 195 of them mutations (each requires approval).

Auth: two API-key methods, because OpenAI's admin keys only work on administration endpoints.
- API key: a project key from https://platform.openai.com/api-keys. Used for every non-administration tool. Health check: `GET /v1/models`.
- Admin API key: an organization admin key from https://platform.openai.com/settings/organization/admin-keys. Used only for the `/organization/*` tools. Health check: `GET /v1/organization/users`.

Connect an account with each method to use both groups of tools. OpenAI does not offer OAuth for third-party API access.

Stream handling: operations that can stream (chat completions, responses, image generation and edits, speech, transcriptions, runs, tool outputs, agent sessions) declare a `text/event-stream` response beside the JSON one, and the generator drops such operations. `openapi.ts` patches that variant out so they are callable; they return the complete JSON response and `stream: true` is not supported. Binary audio from `createSpeech` follows the generator's binary handling. The duplicate `?beta=true` copies of the `/responses` operations are removed because query strings are not valid tool paths; the unsuffixed operations cover them.

Known gaps: `GET /agents/sessions/{session_id}/events` only returns an event stream and is not exposed. Realtime WebSocket sessions are not supported.
