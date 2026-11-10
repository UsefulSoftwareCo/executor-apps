# Ninox

Manage a Ninox workspace: modules, tables, fields, records (including batch, upsert and CSV import), views, reports, file uploads, schema change feeds and server-side script execution.

**Interface:** OpenAPI, Ninox's official Public API document at https://go.ninox.com/api/docs-json (Swagger UI at https://go.ninox.com/api/docs). All calls go to `go.ninox.com`. Every path contains the workspace id, so each tool takes `workspaceId` as an input; it is the same id stored with the account.

**Auth:** Workspace API key (`apiKey`), sent as `Authorization: Bearer <key>`. Create it in the Ninox app under Settings, Workspace, API & integrations, Create API key. The connect form also asks for the workspace id (shown in the workspace's URL and in the same settings page) and uses it for the health check. A key only works in its own workspace. Ninox offers no OAuth for this API.

**Known gaps:** Ninox publishes no spec `servers` entry; the host is pinned to `go.ninox.com`. Self-hosted or private-cloud Ninox servers are not supported. File upload uses presigned URLs, so uploading bytes themselves is outside the tools.
