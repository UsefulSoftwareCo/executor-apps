# Grok (xAI)

Covers xAI's Grok inference API: chat completions, responses, Anthropic-style messages, image and video generation and editing, embeddings, files, skills, document search, tokenization and model listing.

Interface: OpenAPI, the official document at https://api.x.ai/api-docs/openapi.json (served by xAI).

Auth: API key only. Create one in the xAI Console (https://console.x.ai) under API Keys; xAI offers no user-created OAuth apps. The key is sent as a bearer token to `api.x.ai`. Health check calls `GET /v1/api-key`.

Known gaps: the realtime voice WebSocket API, the gRPC API, the management API (`management-api.x.ai`, separate spec and key) and the mTLS endpoint are not covered. Streaming responses are not supported through tools. The document declares no servers, so the base URL is set explicitly.
