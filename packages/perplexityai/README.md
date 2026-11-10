# Perplexity AI

Web-grounded AI with Perplexity: Sonar chat completions, the Search API, embeddings and contextualized embeddings, async Sonar completions, Agent API runs (retrieve, cancel, files; creating a run is not exposed, see Known gaps), model listing, skills and Computer usage analytics. 21 tools, 9 of them mutations (each requires approval).

## Interface

OpenAPI, from Perplexity's official document: https://docs.perplexity.ai/openapi.json (server `https://api.perplexity.ai`).

## Auth

- API key: create one in the Perplexity API console (https://console.perplexity.ai/project/keys). Sent as `Authorization: Bearer <key>`.
- Perplexity has no user-created OAuth apps for this API, so OAuth is not offered.

Health check calls `GET /v1/models`.

## Known gaps

- The OpenAI/Anthropic-compatible Orchestrator gateway specs (`openapi-gateway-*.json`) and the auth-token management spec (`openapi-auth.json`) are not included.
- Streaming responses are not supported by the tool layer. As a result, Create Agent Response (`POST /v1/agent`, `createAgent`) is not exposed: the spec advertises `text/event-stream` for it and the framework drops streamed operations without listing them as skipped.
- Perplexity's Computer MCP (https://www.perplexity.ai/rest/computer/mcp, OAuth scope `asi:query`) is a separate product surface and is not covered. The `@perplexity-ai/mcp-server` npm package exposes far fewer tools (about 3 search/reason/research tools) than this OpenAPI app.
