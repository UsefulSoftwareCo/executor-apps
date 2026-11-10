# AssemblyAI

Speech-to-text and speech understanding with AssemblyAI. Four tool groups: `transcription` (submit audio by URL or upload, fetch, list and delete transcripts, sentences, paragraphs, word search, subtitles, redacted audio), `llmGateway` (chat completions, audio understanding, model list), `agents` (Voice Agent REST: agents and sessions) and `webhooks` (Voice Agent webhook subscriptions).

## Interface

Four official OpenAPI documents published by AssemblyAI, each mounted under its own key (26 tools, 12 mutations). Mutations require approval.

- transcription, OpenAPI 3.1: https://www.assemblyai.com/docs/openapi.yaml (server `https://api.assemblyai.com`)
- llmGateway, OpenAPI 3.1: https://www.assemblyai.com/docs/api-reference/specs/llm-gateway.yaml (server `https://llm-gateway.assemblyai.com/v1`)
- agents, OpenAPI 3.0.3: https://www.assemblyai.com/docs/api-reference/specs/agents.yaml (server `https://agents.assemblyai.com`)
- webhooks, OpenAPI 3.0.3: https://www.assemblyai.com/docs/api-reference/specs/webhooks.yaml (same host)

## Auth

API key only. AssemblyAI has no OAuth. Copy the key from https://www.assemblyai.com/dashboard/api-keys (the vendor's docs link to this page; it redirects to login when signed out). It is sent raw in the `Authorization` header (no `Bearer` prefix) to `api.assemblyai.com`, `llm-gateway.assemblyai.com` and `agents.assemblyai.com`, all listed in `hosts`.

## Known gaps

- The real-time streaming API is WebSocket (AsyncAPI, no OpenAPI) and is not exposed. The optional streaming/voice token endpoints (`/v3/token`, `/v1/token`) are not mounted either.
- The EU endpoint (`api.eu.assemblyai.com`) is not mounted, so EU-region keys are untested.
- `POST /v2/upload` (`transcription` `transcript.uploadFile`) is exposed and untested. The apps framework passes binary bodies as base64 inside the tool input, so file size is limited by the tool-argument size limit; transcribe from a public `audio_url` for large files.
- The vendor's docs MCP server was not used (could not be verified, and a docs-only server would add nothing over the OpenAPI).
