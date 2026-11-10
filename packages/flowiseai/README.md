# Flowise

Flowise (open-source LLM app and agent builder): chatflows and agentflows, predictions, chat messages, document stores (upsert, loaders, chunks, vector store queries), tools, variables, assistants, leads, feedback, attachments and upsert history, on Flowise Cloud (cloud.flowiseai.com).

**Interface:** OpenAPI, from Flowise's official `swagger.yml` (`packages/api-documentation/src/yml/swagger.yml` in [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise), published at https://docs.flowiseai.com/api-reference). The source lacks the `openapi`, `info` and `servers` fields, so `generate.py` adds them and rebuilds `spec.ts`. 46 tools, 30 of them mutations (all require approval). Source snapshot: file last changed at FlowiseAI/Flowise commit `543800562ef7a842ae2921a72fb549082eb38678` (2025-06-22).

**Auth:** API key. In Flowise open Settings > API Keys (or Account Settings > API Keys on cloud) and create a key. Enter the key; it is sent as a bearer token to cloud.flowiseai.com.

**Hosts:** the provider declares `hosts: ["cloud.flowiseai.com"]`, so the key reaches app code only as a sealed handle. Self-hosted Flowise is not supported: instance domains are arbitrary and a static host list cannot cover them.

**OAuth:** Flowise has no user-created OAuth apps for its API, so only the API key is offered.

**Known gaps**

- The tool set follows the documented public API; endpoints the Flowise UI uses internally (credentials, node configs, marketplaces) are not in the official spec and are not exposed.
- A key scoped to specific permissions fails on tools outside that scope.
- Streaming prediction responses and multipart file uploads are limited by what the generic OpenAPI tools can express.
