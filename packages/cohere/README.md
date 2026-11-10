# Cohere

Chat, embeddings, rerank, classification, tokenization, datasets, connectors, embed jobs, fine-tuning and model listing on the Cohere platform.

**Interface:** OpenAPI. The official document is published in Cohere's own repository, https://github.com/cohere-ai/cohere-developer-experience (`cohere-openapi.yaml`), and covers `https://api.cohere.com`. It is loaded live from the `main` branch of that repository (not pinned to a tag or commit), so the tool set can change when Cohere updates the spec. Every mutation requires approval.

**Auth:** API key (`apiKey`), sent as a bearer token. Create one at https://dashboard.cohere.com/api-keys (trial and production keys both work). Cohere offers no OAuth for third-party apps. Health check lists models via `GET /v1/models`.

**Gaps:** The spec mostly describes v1 endpoints plus six v2 paths (chat, parse, embed, audio transcriptions, batches, rerank); streaming responses are not exposed. Some tools map to operations the spec marks deprecated (for example `/v1/generate`, `/v1/classify`, `/v1/summarize`, the `/v1/connectors` set and `/v1/finetuning/finetuned-models`); prefer the v2 equivalents where they exist. The OpenAI-compatible endpoint at `api.cohere.ai/compatibility/v1` and the docs MCP server are not mounted.
