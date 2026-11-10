# Xodo Sign (eversign)

Covers Xodo Sign, formerly eversign, the e-signature service: listing
businesses, creating documents and templates (including from a template), reading
documents and audit logs, cancelling, trashing and deleting, signer reminders and
reassignment, final PDF download URLs, and bulk sending jobs (18 tools).

## Interface

Hand-written tools over the official REST API, `https://api.eversign.com`.
Xodo Sign publishes no OpenAPI document, so the tools follow the documentation at
https://eversign.com/api/documentation/methods. Mutations require approval. Body-level errors (`success: false`) are raised as tool errors.
Most tools take a `businessId`; get it from `businesses.list`. Create and
template calls accept the documented request body as a `document` object, and
`sandbox: 1` runs them in the free test mode.

## Auth

API access key only (`secrets`), sent as the `access_key` query parameter. Find
it in Xodo Sign under the top-left business dropdown, Developer.

Xodo Sign also offers OAuth 2.0 and any user can register an app under
Developer > Register New App (most are approved instantly, the rest within one
business day), so omitting it is a known gap, not a policy choice. The blocker
is technical: the token request at https://app.eversign.com/oauth/token must be
multipart/form-data with client_id, client_secret, code and state in the body,
while the framework's `oauth2` only supports `tokenRequestFormat` of `form` or
`json`. Adding OAuth needs a framework change or a custom flow. The authorize
URL is https://app.eversign.com/oauth/authorize, so `hosts` would also need
`app.eversign.com`. The flow has no scopes or refresh tokens.

## Known gaps

- File upload (`POST /file`, multipart) and raw PDF download are not tools; pass `file_url`, `file_id` or `file_base64` when creating documents, and use `documents.finalDocumentUrl` for signed PDFs. There is no raw (unsigned) PDF tool: the vendor's `download_raw_document` endpoint authenticates only through a URL that embeds the access key, which would leak the key into transcripts and logs.
- CSV validation for bulk jobs (multipart) is not exposed; `bulk.createJob` runs the same validation server-side.
- Embedded signing and webhooks are configured through document fields and the Developer page, not tools.
- Endpoint behavior was checked against the vendor docs only, not a live account.
