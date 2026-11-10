# CustomGPT.ai

Covers the CustomGPT.ai REST API: agents (called "projects" in the API), knowledge sources and pages, conversations and messages, agent settings and plugins, teams, labels, and usage limits.

**Interface:** OpenAPI, from the vendor's official document at https://docs.customgpt.ai/openapi/openapi.json (server `https://app.customgpt.ai`, paths under `/api/v1`). Mutations require approval.

**Auth:** API key only (HTTP Bearer). CustomGPT.ai offers no user-created OAuth apps. Create a key in the CustomGPT dashboard under Developers, "Create new key".

**Known gaps:** the spec declares 115 operations; 114 are exposed as tools. `POST /api/v1/projects/{projectId}/chat/completions` ("Send message (OpenAI format)") is left out because its 200 response streams (`text/event-stream`), which the apps framework does not turn into a tool (it is dropped silently, not listed as skipped). Use the regular send-message tools instead. The health check calls `GET /api/v1/user`.
