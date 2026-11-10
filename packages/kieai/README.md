# Kie.ai

Kie.ai is a pay-as-you-go AI API platform: image, video, music and speech models (Veo, Kling, Runway, Suno, Seedance, Flux, Nano Banana, GPT Image, Seedream and more) plus Claude, GPT, Gemini and Grok chat models, all behind one API key and credit balance.

## Interface

Hand-written tools over the official REST API (https://docs.kie.ai). Kie.ai publishes no single OpenAPI document: its docs site embeds one spec per model page, and every media model uses the same `POST /api/v1/jobs/createTask` call, so the package exposes that call generically instead of 190+ near-identical tools.

- `credits`: remaining credit balance.
- `models.list` / `models.describe`: read the public docs index (https://docs.kie.ai/llms.txt) and a model's page, to get the exact `model` id and `input` fields.
- `omni.audio.create` / `omni.character.create`: the free Gemini Omni voice and character endpoints (`/api/v1/omni/...`).
- `tasks.create` / `tasks.get`: create any Market task and poll it (`GET /api/v1/jobs/recordInfo`).
- `chat.claude`, `chat.responses`, `chat.completions`: the synchronous chat endpoints (Anthropic Messages, OpenAI Responses, OpenAI Chat Completions).
- `files.uploadFromUrl`, `files.uploadBase64`, `files.downloadUrl`: host input files (kept 24 hours) and get 20-minute download links for generated files.

Every call that creates something or spends credits requires approval.

## Auth

API key. Create one at https://kie.ai/api-key. It is sent as `Authorization: Bearer <key>` to `api.kie.ai` and `kieai.redpandaai.co` (file uploads). Kie.ai offers no OAuth.

## Known gaps

- Streaming (`stream: true`) is not supported; chat tools return the complete response.
- Gemini's native `streamGenerateContent` endpoints and file stream (multipart) upload are not exposed; use the OpenAI-format `chat.completions` and the URL/Base64 uploads.
- `tasks.create` takes an untyped `input` object (Kie.ai routes Suno, Veo, Runway, Flux Kontext and the rest through one endpoint), so read the model's schema with `models.describe` first; there are no per-family typed tools.
- Errors come back as HTTP 200 with an error `code` in the body; the tools return the body as is.

Kie.ai returns many errors as HTTP 200 with a non-200 `code`; the tools turn those into errors. Chat tools always send `stream: false`.
