# Cursor

Covers the Cursor Cloud Agents API: create and archive agents, submit and cancel runs, read usage and artifacts, manage saved environments, builds and secrets, and list models and repositories (33 tools).

**Interface:** OpenAPI, Cursor's official document at https://cursor.com/docs-static/cloud-agents-openapi.yaml (server `https://api.cursor.com`).

**Auth:** API key, sent as `Authorization: Bearer <key>`. Create it at https://cursor.com/dashboard/api (cursor.com/dashboard, then API Keys). OAuth is not offered by Cursor.

**Known gaps:** run streaming (`GET /v1/agents/{id}/runs/{runId}/stream`, server-sent events) is not exposed as a tool; poll the run instead. Also, the Admin, Analytics and AI Code Tracking endpoints (`/teams/*`, `/analytics/*`) are not in the published OpenAPI document and are not exposed; they use a separate team admin key.
