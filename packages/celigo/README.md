# Celigo

Manage a Celigo integrator.io account: integrations, flows, exports, imports, connections, jobs, scripts, stacks, tags, lookup caches, EDI profiles and transactions, AI agents, MCP servers, users and other account administration.

## Interface

OpenAPI. Celigo publishes its API as 44 official OpenAPI 3.2 documents, one per resource, in the `@celigo/api-specs` npm package (MIT; see https://developer.celigo.com/api/using-the-api/openapi-specs). Celigo's page names npm only and recommends pinning an exact version; this package loads the files for the pinned version 0.2.87 through the jsDelivr npm mirror, `https://cdn.jsdelivr.net/npm/@celigo/api-specs@0.2.87/dist/<resource>.yml` (jsDelivr is not named by Celigo) and mounts each under its own key (`flow`, `export`, `import`, `connection`, `job`, `aiAgent`, `mcpServer`, ...) in one router. Together they give 531 tools. Mutations require approval.

## Auth

API token (`apiKey`). In integrator.io create an API token (the exact menu path is not confirmed against Celigo's docs, which do not publish a working authentication page; look under Resources for API tokens) and choose a service token (full access or custom) or a personal access token. Enter the token together with the region of your account:

| Region | Value | API host |
| ------ | ----- | -------- |
| US | `us` | api.integrator.io |
| EU | `eu` | api.eu.integrator.io |
| AU | `au` | api.au.integrator.io |
| CA | `ca` | api.ca.integrator.io |

The region is the subdomain you see in the integrator.io URL (none for US). A token belongs to one region and one environment. The health check calls `GET /v1/tokenInfo`.

Celigo's API itself has no OAuth for users; OAuth in Celigo is for third-party connections and is not offered here.

## Known gaps

- The specs are Celigo's prescriptive subset; internal and deprecated operations are not included.
- Specs are pinned to `@celigo/api-specs@0.2.87`; bump the version in `openapi.ts` after reviewing the spec diff.
