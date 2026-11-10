# Griptape

Griptape Cloud: assistants, structures, threads, rulesets, knowledge bases, data connectors, tools, models, budgets, libraries and more.

**Interface:** OpenAPI. Griptape's own OpenAPI 3.1.0 document (info.version 2023-09-19), hosted on Griptape's S3 bucket at https://griptape-cloud-assets.s3.amazonaws.com/Griptape.openapi.yaml (single server `https://cloud.griptape.ai/api`). Griptape republishes the file in place, so the URL is stable but the tool list can change. No official Griptape remote MCP server was found; the OpenAPI document is the broadest official interface.

**Approvals:** every mutation (POST, PUT, PATCH, DELETE) requires approval. Three GET operations also require it because they start work or return credentials: `functionExecute.createFunctionExecutionGet` (runs a function), `structures.invokeStructureWebhookGet` (triggers a structure run) and `connections.getToken` (returns a connection access token).

**Auth:** API key sent as `Authorization: Bearer <key>` (HTTP bearer). Create one in Griptape Cloud under Configuration > API Keys (https://cloud.griptape.ai/configuration/api-keys); keys start with `gt-`. Griptape documents API keys as the only method and has no user-created OAuth apps, so there is no OAuth method. Credentials are sent only to `cloud.griptape.ai`.

**Icon:** Griptape's favicon mark (from griptape.ai, no SVG published), background made transparent, with a white copy for dark backgrounds.

**Gaps:** 231 of the spec's 233 operations are exposed as tools. The two server-sent-event stream GETs are not exposed: `GET /api/assistant-runs/{assistant_run_id}/events/stream` (GetAssistantRunEventsSSE) and `GET /api/structure-runs/{structure_run_id}/events/stream` (GetStructureRunEventsSSE); the importer drops them without reporting a skip. The health check calls `GET /api/models`.
