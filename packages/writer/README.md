# Writer

Writer enterprise AI platform: chat and text completions with Palmyra models, Knowledge Graphs (create, query, attach files), files, applications and jobs, web search, PDF parsing and vision.

**Interface:** OpenAPI. The spec is the one Writer publishes for its official SDKs (`writer-python` `.stats.yml` `openapi_spec_url`, a Stainless-generated document hosted on Google Cloud Storage and pinned by content hash): https://storage.googleapis.com/stainless-sdk-openapi-specs/writerai/writer-0aff90cfbc9dc550cf49aed4150d2aeb099265f098fc58276407207a4c803344.yml. API base is `https://api.writer.com`. The pinned URL must be bumped when Writer publishes a new spec.

**Auth:** API key (bearer token). Create it in the Writer AI Studio: open your API app, then Keys, then Generate key (https://dev.writer.com/api-reference/api-keys). Writer offers no OAuth for the public API.

**Gaps:** The spec has 29 operations. 25 are generated from the OpenAPI document under `api.*`. The other four (`POST /v1/chat`, `/v1/completions`, `/v1/graphs/question`, `/v1/applications/{application_id}`) declare `text/event-stream` responses, which the OpenAPI router skips without listing them, so they are hand-written under `text.*` (`chat`, `completions`, `askGraph`, `generateFromApplication`) and always send `stream: false` (streaming is not supported). For streaming, use Writer's hosted MCP server (https://api.writer.com/v1/mcp, OAuth) or the npm `writer-sdk-mcp` stdio server instead. Only the public REST API is covered; no-code agent builder, Writer Framework and Writer Agent features are not exposed. The icon is a hand-drawn vector redraw of Writer's official W mark (writer.com), since the vendor publishes it only as a PNG.
