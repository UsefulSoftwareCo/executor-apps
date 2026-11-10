# Turbot Pipes

Covers the Turbot Pipes REST API: the authenticated user, organizations and members, workspaces, connections, connection folders, datatanks, integrations, pipelines, queries, tokens, snapshots, notifiers, and related resources.

Interface: OpenAPI, from Turbot's official definition at https://pipes.turbot.com/api/latest/docs/openapi.json (linked from https://turbot.com/pipes/docs/reference/api). Base URL `https://pipes.turbot.com/api/v0`.

Auth: API token only. Pipes has no user-created OAuth apps. Create a token under Settings > Tokens in Turbot Pipes (https://pipes.turbot.com) and paste it; it is sent as `Authorization: Bearer <token>`. The health check calls `GET /actor`. Every mutation requires approval. The framework classes all non-GET operations as mutations, so `POST` query calls prompt for approval each time, while `GET` query calls run without a prompt.

Known gaps: none known. Workspace SQL queries are covered by the query operations on the Pipes API (`GET` and `POST` on `/org/{org_handle}/workspace/{workspace_handle}/query`, the `query/data.{extensions}` variants, and the user-scoped equivalents).
