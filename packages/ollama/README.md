# Ollama

Ollama Cloud: chat, generate, embeddings, model list/show/ps, model create/copy/pull/push/delete, blobs, version, usage and balance from the OpenAPI document, plus hand-written `web.webSearch` and `web.webFetch` (18 tools in total, 12 of them POST mutations that need approval).

Interface: OpenAPI, Ollama's official document, pinned to the `v0.40.3` release tag of ollama/ollama: https://raw.githubusercontent.com/ollama/ollama/v0.40.3/docs/openapi.yaml. The tool set therefore changes only when this package bumps the tag. The document declares the local server `http://localhost:11434`; a hosted Executor cannot reach a local daemon, so every operation is pointed at `https://ollama.com` (Ollama Cloud) via `baseUrl`.

Web search and web fetch (`POST https://ollama.com/api/web_search` and `/api/web_fetch`, documented at https://docs.ollama.com/capabilities/web-search) are not in the OpenAPI document, so they are hand-written with the account's bearer token.

Auth: API key (bearer). Create one at https://ollama.com/settings/keys. Ollama has no OAuth for users. Health check calls `GET /api/tags`.

Known gaps: self-hosted/local Ollama servers are not supported (host is fixed to ollama.com). `/v1/systemone` is removed: the spec says it is "currently available locally in Ollama" only. The pull/push/create/copy/blob operations come from the spec and are local-server operations that may not apply to Cloud; they were not verified against ollama.com. Streaming responses are not streamed through tools. The health check's behavior with an invalid key was not verified.
