# Anthropic

Use the Claude API: send Messages, count tokens, list models, run message batches and manage files (16 tools). For organization administration (members, workspaces, usage and cost reports) use the separate `anthropicadministrator` package, which covers the Admin API.

**Interface:** hand-written tools using `fetch` against `https://api.anthropic.com/v1`, from the official reference at https://platform.claude.com/docs/en/api. Anthropic publishes no stable public OpenAPI URL (the SDK specs are Stainless-hosted and versioned by hash), so no spec is compiled. Mutations, including `messages.create` and `batches.create` (which are billed), require approval.

**Auth:** API key only. Create one in the Claude Console under Settings, API keys (https://platform.claude.com/settings/keys); it starts with `sk-ant-api`. It is sent in the `x-api-key` header with `anthropic-version: 2023-06-01`. Anthropic offers no OAuth for third-party apps on the Claude API.

**Known gaps:**
- `messages.create` is non-streaming only.
- Not exposed: Files upload (multipart), the Skills API, the Models/Messages beta features that need extra `anthropic-beta` headers, and the Admin API.
- The Files API is beta and sends `anthropic-beta: files-api-2025-04-14`.
- Health check calls `GET /v1/models?limit=1`. Not verified against a live key.
