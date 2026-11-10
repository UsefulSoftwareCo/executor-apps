# Formcarry

Manage Formcarry forms, submissions, spam, webhooks and delivery logs, notification recipients and email servers.

## Interface

OpenAPI, from Formcarry's official live document at https://api.formcarry.com/docs-json (v1 REST API, base URL https://api.formcarry.com). Mutations require approval. The legacy `formcarry.com/api` API (`api_key` header) is not covered; the v1 API supersedes it.

## Auth

- **API key**: create a scoped key (`fc_live_...`) at https://app.formcarry.com/api-keys with the scopes you need; it is shown once. Sent as `Authorization: Bearer`.
- OAuth: Formcarry documents no user-created OAuth apps, so none is offered.

## Known gaps

The public form-submit endpoint (`POST https://formcarry.com/s/<form id>`) is not an API operation and is not included. Tool availability depends on the scopes of the key.
