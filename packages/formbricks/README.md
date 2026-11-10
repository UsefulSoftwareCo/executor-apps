# Formbricks

Formbricks is an open-source survey and experience-management platform. This package exposes the Formbricks v2 API: responses, contacts (including bulk upload), contact attributes and attribute keys, surveys' personalized contact links, webhooks, teams, workspace teams, users, roles, and API-key info. 40 tools, 24 of them mutations (all require approval).

Interface: OpenAPI, from Formbricks' own document at https://raw.githubusercontent.com/formbricks/formbricks/main/docs/api-v2-reference/openapi.yml (also published at https://formbricks.com/docs/api-v2-reference/openapi.yml).

Auth: API key. Create one in the Formbricks app (Settings; per the vendor's guide, click API Keys in the breadcrumb at the top left, under the organization dropdown, then Add API Key). Add a Workspace permission (read, write or manage) for each workspace the key should reach: the key must be workspace-scoped, because an organization-only key (Organization Access) is rejected with 401 on most operations, which are workspace routes. The health check fails for a key with no workspace permissions. It is sent as the `x-api-key` header. Formbricks has no user-created OAuth apps.

Public client endpoints: the six `/client/{workspaceId}/...` operations are the unauthenticated SDK-facing API (they ignore the key); they are kept because they work, but they are not management operations.

Known gaps:
- Only Formbricks Cloud (`app.formbricks.com`) is supported; self-hosted instances use a different origin.
- Formbricks' v1 management API (surveys CRUD, action classes) has no published OpenAPI document and is not covered; the v2 document has no survey list/create operations. A hand-written v1 survey read was not added: the v1 API is unspecified, differs in response shapes, and mixing it into the OpenAPI router would need a separate hand-built tool set that cannot be verified without a live key.
