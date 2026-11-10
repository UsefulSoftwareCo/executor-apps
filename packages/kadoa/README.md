# Kadoa

Kadoa turns websites and documents into structured data. This package covers workflows (create, run, history, triggers), extracted data and changes, schemas, templates, crawling sessions, variables, notification channels and settings, and activity exports.

**Interface:** OpenAPI, Kadoa's official document at https://api.kadoa.com/openapi (about 108 paths, one origin, `https://api.kadoa.com`). Kadoa also runs a remote MCP server (`https://mcp.kadoa.com/mcp`, OAuth with dynamic client registration). Its tools were not counted and not compared; REST with an explicit API key was chosen.

**Auth:** API key. Create one in the Kadoa app under Settings > General (https://kadoa.com/settings), and paste it when connecting. It is sent as the `x-api-key` header. The spec's bearer/JWT scheme is not offered. Kadoa's docs do not describe a customer-created OAuth app for the REST API (unverified that none exists); its CLI and MCP sign in with OAuth separately.

**Gaps:** mutations require approval, and so does `GET /v4/workflows/{workflowId}/data/export` (`workflows.getDataExport`), which creates an export and returns a signed URL that opens without credentials. About 15 operations (such as `POST /v5/agent`, `POST /v5/agent/answer`, some `/v5/agent/*` and `/v5/notifications/*/csv` routes) declare no security in the vendor spec; the package still sends `x-api-key` to them, which is harmless since it is the same host. The health check calls `GET /v4/me/features`.
