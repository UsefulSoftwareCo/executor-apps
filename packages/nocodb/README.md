# NocoDB

Bases, tables, fields, views, records (CRUD, bulk, links, aggregates), attachments, filters, sorts, webhooks, shared views and the rest of the NocoDB REST API on NocoDB Cloud (`app.nocodb.com`).

Interface: OpenAPI, from NocoDB's own document in the nocodb/nocodb repository, https://raw.githubusercontent.com/nocodb/nocodb/2026.09.1/packages/nocodb/src/schema/swagger.json, pinned to release tag 2026.09.1 (the source of the API reference at https://data-apis-v2.nocodb.com). 270 tools are exposed, 164 of them mutations that need approval. 8 operations are skipped by the compiler (7 `missing_component`, 1 `request_body`).

## Auth

- API token (`apiKey`): in NocoDB open Team & Settings, "API Tokens" (or Account settings, Tokens) and create a token. It is sent as the `xc-token` header. The published document declares no security requirement on its operations, so this package applies the `xc-token` scheme to all of them.

## Known gaps

- Only NocoDB Cloud (`app.nocodb.com`) is supported; self-hosted instances use a different origin and are not.
- The document declares the `xc-auth` JWT header as required on most operations; this package removes that parameter (228 parameter lists patched) so the API token is the only credential. Whether every route accepts an API token is not guaranteed by the vendor's docs.
- Operations that need a signed-in user's JWT (sign-in, sign-up, password, profile and similar) are exposed because the document lists them, but an API token cannot use them.
- The document also declares `bearerAuth` (Authorization: Bearer) as an alternative; it is intentionally not used, since `xc-token` is the documented API-token header.
- No OAuth: NocoDB offers no user-created OAuth app flow for its REST API.
