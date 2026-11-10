# Dovetail

Customer research in Dovetail: projects, docs, notes, insights, data, channels, contacts, folders, comments, fields, files and search. Mutations require approval.

## Interface

Dovetail's public REST API at `https://dovetail.com/api`. Dovetail publishes an OpenAPI definition on each page of its reference (https://developers.dovetail.com/reference) but no single document, so `dovetail.json` is the union of those official per-endpoint definitions (111 operations), merged unchanged apart from one shared server and bearer security scheme. Regenerate it by re-merging the `# OpenAPI definition` block of each reference page (the `.md` form of every page listed in https://developers.dovetail.com/llms.txt).

## Auth

API token (`apiKey`). Create one at https://dovetail.com/settings/user/account (tokens start with `api.` and expire after 30 days). It is sent as `Authorization: Bearer <token>`.

OAuth is not offered: Dovetail's docs say OAuth 2.0 for third-party apps is "coming soon", and the hosted MCP server supports neither dynamic client registration nor client metadata documents and exposes no client id or secret.

## Known gaps

- Dovetail's hosted MCP server (`https://dovetail.com/api/mcp`, about 50 tools) is not used because the REST API covers more.
- Binary file upload and download use pre-signed URLs on other hosts, which tools cannot call; only the upload/download initiation endpoints work.
- Tokens expire after 30 days and must be replaced.
