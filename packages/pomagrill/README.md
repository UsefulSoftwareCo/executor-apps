# POMA Grill

POMA Grill is a project-scoped context engine: ingest documents, manage indexed content, and retrieve prompt-ready context for LLM applications. This package covers the Grill endpoints (ingest, search, search in a document, attributes, documents, original files, images, tables, pages) plus POMA's project, organisation, job and usage endpoints.

Interface: POMA's official OpenAPI document, https://api.poma-ai.com/v3/openapi.yaml (63 tools, 29 of them mutations that require approval). `grillSearch` and `grillSearchInDoc` are POST but read-only, so they are marked as queries and run without approval.

The document ingest operations (`POST /primeCut/ingest` and `POST /primeCut/ingestForm`) belong to POMA's primeCut document-processing service. They are the documented way to ingest files into Grill (the spec's workflow starts there), so they are included and require approval..

## Auth

API key only. Create a project in the POMA console (https://console.poma-ai.com) and generate its project API key (`poma_proj_...`), then paste it as the Bearer token. The OpenAPI spec documents the `poma_proj_*` prefix and is treated as authoritative; POMA's quickstart page writes `poma_prod_gr_...`, so the exact prefix may differ in the console. A project key is bound to one project, which is what the Grill endpoints and the health check (`GET /projects/info`) expect. Account keys (`poma_acc_...`) also work for most endpoints but need an `X-Project-ID` header on Grill calls and are rejected by `/projects/info`, so the connection health check will fail with one.

## Known gaps

- POMA also runs an official remote MCP server (https://mcp.poma-ai.com/grill, OAuth with dynamic client registration or an `x-api-key` header). It exposes ten Grill-only tools; the OpenAPI package is a superset, so it is not mounted.
- `POST /generateApiKey` (account-level key generation) is skipped: its security block references the undefined scheme `bearerAuth` (lowercase), which the compiler reports as an `auth_method` skip.
- OAuth is not offered: the spec's BearerAuth is a JWT account login token and Grill endpoints require a project key. The official OAuth MCP is only a 10-tool subset.
- Stability: POMA has a pending change (poma-ai/poma-grill-mcp#30) moving Grill to api.index4.ai/index4ai/v1. The spec at api.poma-ai.com/v3 is still served and documented; if POMA moves Grill, re-check the spec URL and add index4.ai to the hosts.
- Other notes: Registration endpoints (`/registerEmail`, `/verifyEmail`) are exposed but unauthenticated flows are better done in the console.
- File upload endpoints take raw bytes; large documents are impractical through tool calls.
