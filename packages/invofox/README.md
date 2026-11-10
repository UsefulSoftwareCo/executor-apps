# Invofox

Invofox is a document AI API that extracts structured data and OCR text from invoices and other business documents. This package covers uploads (by URL or direct file), imports, documents (list, get, OCR, plain text, update), companies, providers, clients and users, including bulk user deletion.

## Interface

OpenAPI, from Invofox's two official OpenAPI 3.1 documents, mounted under their own keys in one router against `https://api.invofox.com`:

- `main`: https://developers.invofox.com/openapi/main-reference.json (documents, companies, providers, clients, users; 23 tools).
- `ingest`: https://developers.invofox.com/openapi/ingest-reference.json (uploads, files, imports; 5 tools).

The deprecated operations (`PUT /documents/{id}/type`, `PUT /documents/{id}/publicState`, `POST /v1/ingest/single`, `POST /v1/ingest/single-url`) are removed with patches; the update-document and upload endpoints replace them. The webhooks-reference document describes webhooks Invofox sends to you, not API calls, so it is not mounted. All mutations require approval.

## Auth

API key. Create it at https://app.invofox.com under your environment, **API and Webhooks**; keys are scoped to an environment. It is sent in the `x-api-key` header. Invofox offers no OAuth for user-created apps; the spec's `x-access-token` scheme is for browser sessions and is not offered.

## Known gaps

- Webhooks (`document.processed` and others) are configured in the Invofox app, not through these tools.
- Deprecated endpoints are not exposed.
