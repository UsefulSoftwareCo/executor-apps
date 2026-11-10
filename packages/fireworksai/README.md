# Fireworks AI

Run and manage generative AI on Fireworks AI: chat completions, text completions, embeddings, the Responses and Anthropic-compatible Messages APIs, plus models, deployments, datasets, fine-tuning jobs, evaluations, API keys and account quotas.

## Interface

OpenAPI, from Fireworks' official merged document at https://docs.fireworks.ai/merged.openapi.yaml (gateway, inference, responses, text-completion and Anthropic messages specs combined). The spec has 222 operations. 220 are generated under `api` (122 of them mutations, each requiring approval). The framework silently drops operations whose 200 response declares `text/event-stream`, which removes `POST /v1/chat/completions` and `POST /v1/completions`; these two are covered by hand-written tools under `inference` (`createChatCompletion`, `createCompletion`) that call the same endpoints with `stream: false` and return JSON, each requiring approval since they incur usage cost.

## Auth

API key (bearer token). Create one in the Fireworks dashboard at https://app.fireworks.ai/settings/users/api-keys or with `firectl api-key create`. Fireworks does not offer user-created OAuth apps, so there is no OAuth method.

## Known gaps

Streaming responses are not available through tools (the hand-written inference tools force `stream: false`). The docs MCP server (https://docs.fireworks.ai/mcp) only searches documentation and is not mounted.
