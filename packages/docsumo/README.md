# Docsumo

Docsumo is an AI document processing platform. This package exposes its public API: upload files or URLs/base64 documents, list documents, fetch extracted data and document details, usage limits and document types, review URLs, review actions, field edits, auto-split info/download, moving and deleting documents.

**Interface:** OpenAPI, Docsumo's own document published through its ReadMe API reference (`https://dash.readme.com/api/v1/api-registry/l95kgmc1nkqh0`, ReadMe's API registry, which is the publisher's own host for the document, linked from https://support.docsumo.com/reference). The document declares no security scheme, so `openapi.ts` adds an `apikey` header scheme; the key is filled in from the account. Base URL `https://app.docsumo.com`.

**Auth:** API key only (Docsumo has no user-created OAuth apps). Copy it from https://app.docsumo.com/settings/webhook-api/ . It is sent as the `apikey` header on 14 operations and as `x-api-key` on two (field PATCH and move), exactly as the OpenAPI document declares each one; both are bound through the account's parameter defaults, so callers never supply them. The header names come from the spec: Docsumo's authentication page (https://support.docsumo.com/reference/authentication.md) only says to paste the key into "the Authorization header or relevant field" and names no header or prefix, and nothing here was verified against a live key. `GET usbs-analytics` also declares a required `content-type` header; it defaults to `application/json`.

**Approvals:** all six mutations (upload, upload/custom, review actions, delete, field PATCH, move) require approval. The two review-url GETs mint signed shareable review links; they are reads and are not gated.

**Icon:** the mark from docsumo.com's apple-touch-icon (180px PNG); no Simple Icons entry exists.

**Gaps:** the document covers 16 operations; newer endpoints not in the published reference are absent.
