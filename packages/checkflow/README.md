# CheckFlow

Run and build CheckFlow checklists: start and complete checklists and tasks, manage templates, Data Sets, schedules, webhooks, and read members, groups and tags.

**Interface:** OpenAPI. The official CheckFlow API v3 document at https://api.checkflow.io/openapi/v3.json (docs: https://docs.checkflow.io/docs/api-v3/overview). CheckFlow also ships an MCP server, but the REST API exposes the same operations, so this package uses the OpenAPI document.

**Auth:** API key. An Administrator creates one on the API & Integrations tab of Team Management (https://app.checkflow.io/team/api) and chooses which member the key acts as. The key is sent in the `X-API-KEY` header. When connecting, set the region to `US` or `EU` to match the workspace (`api.checkflow.io` or `api-eu.checkflow.io`). The vendor's API v3 docs describe only API keys; no OAuth is declared.

**Gaps:** Mutations require approval. The legacy v1/v2 API is not covered.
