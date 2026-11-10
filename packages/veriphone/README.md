# Veriphone

Phone number validation through Veriphone: validity, line type, carrier, region, country, timezones and E.164 formats.

Interface: two mounts under one account.

- `api`: hand-written tools over the official REST API v3, https://veriphone.io/docs/v3 (Veriphone publishes no OpenAPI document): `verify` (static or `current` mode), `credits`, `coverage`, and the bulk file tools `bulk.list`, `bulk.get`, `bulk.status`, `bulk.download`, `bulk.verify`, `bulk.delete` (https://veriphone.io/docs/bulk).
- `mcp`: Veriphone's official remote MCP server, https://mcp.veriphone.io (https://veriphone.io/docs/mcp), exposing `verify_phone`, `verify_phones` (batch of up to 50), `get_credits`, `current_coverage` and `example_number`.

Auth: API key, sent as `Authorization: Bearer <key>` to both hosts. Get it from the API keys page of your Veriphone dashboard (https://veriphone.io/dashboard). Veriphone has no OAuth. The connection check calls the free `GET /v3/credits`.

Approvals: every tool that spends credits or writes data asks for approval: `api.verify` (1 or 10 credits, and `record` writes to history), `api.bulk.verify`, `api.bulk.delete`, and the MCP `verify_phone` and `verify_phones`.

Known gaps: `POST /v3/file/upload` is multipart/form-data and is not exposed; upload CSVs in the dashboard, then use the bulk tools with the file id. `mode` accepts only `current` (omit it for static, the default).
