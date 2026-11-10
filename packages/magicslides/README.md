# MagicSlides

Create and edit presentations, docs, sheets, meeting notes and frames with MagicSlides, plus template listing and account lookup (`list_templates`, `create_presentation`, `get_presentation`, `update_presentation`, `create_doc`, `create_sheet`, `create_meeting_notes`, `create_frames`, `whoami` and more).

## Interface

MagicSlides' official remote MCP server (Streamable HTTP): `https://www.magicslides.app/api/mcp/mcp`. The vendor also publishes an OpenAPI 3.1 document at <https://www.magicslides.app/openapi.json> (`/api/gpt/*` and the `ppt_from_*` endpoints, API key auth); it is not mounted because the MCP server is a superset for presentations and also covers docs, sheets and meeting notes, and the OpenAPI document declares no server URL.

## Auth

OAuth 2.1 only, discovered from `/.well-known/oauth-protected-resource` with dynamic client registration; no OAuth app needs to be created by hand. The redirect URI is the one Executor shows when connecting. Tools without `readOnlyHint` (everything that creates or edits content, and may spend credits) always ask for approval.

## Known gaps

- API-key access (`ms-api-...`, `x-api-key`) is not offered; the MCP server requires OAuth. The OpenAPI endpoints would be the route for key-only use.
- The older `/api/cli/*` endpoints (including `generate-html-studio` and `models`) are not exposed.
