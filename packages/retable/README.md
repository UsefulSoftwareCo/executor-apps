# Retable

Workspaces, projects, tables, columns and rows in Retable, plus row search. 17 hand-written tools (reads plus approval-gated writes) over the official public REST API, https://api.retable.io (docs: https://docs.retable.io/retable-user-guide/retable-api/api).

Retable publishes no OpenAPI document and no MCP server, so the tools are written by hand against the documented endpoints. The v1 and v2 row-read endpoints are both exposed (`rows.list` and `rows.listFlat`).

## Auth

API key only. In Retable, open the user menu (top right), choose the API tab, enable the key and copy it. It is sent as the `ApiKey` header. Retable does not offer OAuth for the public API. Rate limit: 12 requests per second.

## Gaps

- File upload (multipart) is not exposed.
- IDs come from the table URL `app.retable.io/retable/{workspace}/{project}/{table}`, or from the list tools.
- Insert, update and delete need owner or editor access on the table (delete: owner).
- The vendor docs are a beta and inconsistent in places (`cell_value` vs `cell_data`); the tools follow the working examples. Not tested against a live key.
