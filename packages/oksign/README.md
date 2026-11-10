# OK!Sign

Covers OK!Sign (oksign.be), the Belgian legal e-signature service: uploading
PDF/Word documents, defining signature forms and signers, notifications,
briefcases, SignExpress and EditorExpress links, contacts, signed document
retrieval, metadata, audit trails, credits, users, email templates and
organisation-token URLs (31 tools).

## Interface

Hand-written tools over the official REST API, `https://oksign.be/services/rest/v1`
(Metadata v2 at `/services/rest/v2`). OK!Sign publishes no OpenAPI document, so the
tools follow the documentation at https://oksign.be/public/api/. Mutations
require approval.

## Auth

API credentials only (`secrets`): the account number, authentication token and
organisational token, sent together as
`x-oksign-authorization: <accountnbr>;<authtoken>;<orgtoken>`. Create tokens in
the OK!Sign dashboard under REST API, then API Console. OK!Sign has no OAuth.

## Known gaps

- `documents.active`, `documents.signed` and `account.webhookErrors` are limited by OK!Sign to one call per 3 minutes.
- Document upload/download use base64 content (10 MB upload limit); audit trail is JSON only, not PDF.
- The deprecated v1 metadata endpoint is not exposed.
- Callbacks, return URLs and webhooks are calls OK!Sign makes to your own URLs; they are not tools.
- Account-level endpoint paths were checked against the vendor docs only, not a live account. Polling endpoints (`GET /services/rest/v1/documents/signed`, `/webhooks/retrieve`) are listed explicitly in the docs with `x-oksign-starttime` and `x-oksign-endtime`.
