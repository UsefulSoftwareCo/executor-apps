# AI/ML API

Exposes the AI/ML API (aimlapi.com), a single gateway to hundreds of AI models, as Executor tools: chat completions, the Responses API, Anthropic-style messages, embeddings, speech-to-text, text-to-speech, image generation and editing, video and audio generation, OCR, batches and decisions.

## Interface

OpenAPI, loaded live from the vendor's own document at <https://api.aimlapi.com/docs-json> (official, published by AI/ML API). It compiles to 20 tools (15 mutations, none skipped) on `https://api.aimlapi.com`. Every mutation requires approval.

`openapi.ts` repairs the document with `patches`:

- Chat completions, Responses and Messages declare an `text/event-stream` response next to JSON, which the compiler skips as unsupported. The event-stream response is removed and the request body is replaced with a compact schema of the shared parameters (the vendor's body is one union member per model family, which patches cannot edit). `stream` is pinned to `false`, so these tools return the complete JSON response and cannot stream. Other model-specific parameters pass through.
- `GET /v1/responses/:response_id`, `GET /v1/stt/:generation_id` and `POST /v1/batches/cancel/:batch_id` are rewritten to `{response_id}`, `{generation_id}` and `{batch_id}` paths with a required string path parameter, so the id is a tool input. Their response schemas are generic objects.

## Auth

API key only. Create one on the AI/ML API dashboard at <https://aimlapi.com/app/keys>; it is sent as `Authorization: Bearer <key>`. The vendor offers no OAuth. The account health check reads the balance from `GET /v2/billing`.

## Known gaps

- The vendor's spec covers only the inference endpoints. Service endpoints (`/v2/billing`, `/v2/usage`, model list) are documented at <https://docs.aimlapi.com> but absent from the OpenAPI document, so they are not tools. The vendor's official remote MCP server at <https://mcp.aimlapi.com/mcp> (OAuth 2.1 or Bearer) covers balance and model discovery through its `tools_search`, `tools_inspect`, `tools_run` and `tools_run_status` meta-tools.
- The spec has no security scheme; the package supplies a bearer scheme itself.
- Streaming (`stream: true`) is not available.
