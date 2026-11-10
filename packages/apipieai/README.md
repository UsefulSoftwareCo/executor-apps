# APIpie AI

Covers APIpie.ai's unified, OpenAI-compatible model API: chat completions, embeddings, image generation, text-to-speech and transcription, web search and scrape, PII anonymization, document parsing, image upload, jobs and real-estate data, the model catalog, query (usage) history, state settings, Pinecone-style vector collections and RAG tune collections.

## Interface

OpenAPI, from APIpie's official document at https://apipie.ai/docs/openapi.json (OpenAPI 3.0.0, server https://apipie.ai). All 33 operations import with none skipped, including the multipart ones (`/v1/parser`, `/v1/audio/transcriptions`, `/urlshare`). Every non-GET operation is a mutation and asks for approval, including the POST endpoints that only read (vector queries, collection listings), because the generator classifies by HTTP method.

The spec's paths for vectors and RAG tune are `/vectors...` and `/ragtune...`, not the `/v1/vectors` paths shown in some older docs pages. The tools follow the spec.

## Auth

API key: create one at https://apipie.ai/profile/api-keys. It is sent as `Authorization: Bearer <key>` (the spec's `apikey`/`BearerAuth` schemes; its `ApiKeyAuth` scheme sends the same key in `x-api-key`). APIpie offers no OAuth.

## Notes and known gaps

- The vendor's endpoint pages show examples against `https://api.apipie.ai`. That host does not resolve; the working base is `https://apipie.ai`, which is what this package uses. Do not copy the `api.` host.
- Streaming chat (`stream: true`) and binary responses (text-to-speech audio) cannot be consumed as JSON tool results; non-streaming calls work.
- The spec's `/v1/chat/completions` path item carries a `parameters` entry rather than an operation; only its POST is a tool.
