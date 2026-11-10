# Leiga

Manage Leiga (AI project management) from Executor: projects, issues and subtasks, labour records, epics, sprints, versions, tags, comments, files, webhooks, workflows, organization users and project members.

## Interface

OpenAPI. Leiga's official API reference is published on Apidog as one OpenAPI fragment per endpoint (index: https://share.apidog.com/5a741107-c211-410f-880c-048d1917c984/llms.txt). There is no single downloadable spec, so `openapi-document.json` merges the 113 vendor fragments (server `https://app.leiga.com/openapi/api`), with the per-request `accessToken` header moved into a security scheme. Nothing else was changed.

## Auth

API access token (`secrets`, one field). Leiga has no OAuth for third-party apps. Create a personal API key under avatar, My Settings, Personal API Keys (https://guide.leiga.com/personal/key); an organization admin can manage OpenAPI under System Settings, OpenAPI. Paste the resulting token into Executor's secure connection link; Executor sends it in the `accessToken` header.

The `/authorize/*` endpoints (`access-token`, `access-permanent-token`, `refresh-token`) are deliberately not tools: they take the OpenAPI client ID and secret key (and the old refresh token) as request-body arguments, which would route long-lived secrets through agent chat. Call them yourself outside the agent (for example with curl) if you need to mint a token.

Token lifetime: the vendor's page for `access-permanent-token` documents `expireIn` as seconds until expiry, "will expire in 30 days, -1 means no expiration" (example 2592000). Not verified live (no credentials used), so assume a pasted token may expire after 30 days. When it does, calls fail and the health check reports the account as unhealthy; mint a new token and update the account's secret.

Health check: `GET /project/list` (read-only). Leiga replies HTTP 200 with a JSON `code` on failures; the docs never define `code`, only show `"0"` in examples. The check requires `code` to equal `"0"` (observed, not documented) and fails otherwise or on a non-2xx status. Tool results also carry the `code`.

## Known gaps

- Source fragments were fetched from the Apidog share above in October 2026 and merged; the document is a derived artifact and can drift from the vendor's reference.
- Response schemas come from vendor fragments that conflict with their own examples (the schema puts fields such as `accessToken` at the top level while examples nest them under `data`, and `code` appears only in examples), so tool outputs are typed loosely.
- 3 of 113 operations (the `/authorize/*` endpoints) were removed for the credential reason above. 2 were skipped by the compiler as `missing_component`: `POST /comment/list-sticker` (List Comment Sticker) and `POST /issue/trash-select-options` (Get Trash Select Option List), because their fragments reference `#/components/schemas/Body`, which the vendor does not include.
- POST read endpoints (for example `/issue/page`) are classified as mutations and so always require approval.
- No official MCP server was found in the vendor docs; this was not confirmed by a web search.
- Trash endpoints are not available on the free plan.
- Multipart file upload/download endpoints depend on the generic OpenAPI handling.
