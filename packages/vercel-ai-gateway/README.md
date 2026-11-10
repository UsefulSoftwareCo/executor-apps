# Vercel AI Gateway

Vercel AI Gateway routes requests to hundreds of models from many providers behind one API and one bill. This package covers model discovery (models, per-provider endpoints, pricing, uptime), inference (OpenAI chat completions, Anthropic messages, OpenAI responses, embeddings, Cohere-compatible rerank, decisions, speech generation, transcription), and usage (credit balance, generation lookup, spend reports).

## Interface

Hand-written tools over the gateway's documented REST API at `https://ai-gateway.vercel.sh/v1` (https://vercel.com/docs/ai-gateway/sdks-and-apis/rest-api). The gateway publishes no OpenAPI document and no remote MCP server. The Vercel REST API package (`vercel`) covers the rest of Vercel; this package is only the gateway.

## Auth

- API key: create an AI Gateway API key in the Vercel dashboard under AI Gateway, then API Keys (https://vercel.com/docs/ai-gateway/authentication-and-byok#api-key). It is sent as `Authorization: Bearer <key>`.
- Health check calls `GET /v1/credits`, since `/v1/models` is public.

No OAuth: the gateway accepts only API keys and Vercel OIDC tokens (which exist only inside Vercel deployments).

## Gaps

- Inference tools take the request JSON as `body`; streaming is rejected (`stream: true` throws before any request is sent).
- Image generation has no dedicated documented REST endpoint: use `chatCompletions` with an image-capable model. Video, realtime voice (WebSocket), streaming transcription, count-tokens and budgets/API-key management are not exposed. Compaction is reachable through `responses`.
- Speech and transcription use the documented `/v4/ai/*` endpoints, which are in beta and may not be enabled for every team.
- `rerank` uses `/v2/rerank` (string documents); the `/v1/rerank` object-document dialect is not exposed.
- ICON EXCEPTION REQUIRED: the icon is the Vercel triangle (Simple Icons `vercel`). Vercel publishes no separate AI Gateway mark, and AUTHORING.md forbids a parent company's logo, so this needs Rhys's explicit approval or a replacement mark. It is not approved yet.
- `getReport` is unavailable on Hobby and Pro-trial plans.
