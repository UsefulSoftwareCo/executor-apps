# Documenso

Open-source e-signature platform. Covers documents, templates, recipients, fields, attachments, folders, envelopes and embedding presign tokens.

**Interface:** OpenAPI, from Documenso's official v2 document at https://app.documenso.com/api/v2/openapi.json (the legacy v1 API is not included).

**Auth:** API key (`apiKey`). Create one in Documenso under Team Settings > API Tokens (tokens are scoped to a team) and paste it. It is sent as the raw `Authorization` header value, without a `Bearer` prefix. OAuth is not offered.

**Known gaps:** Hosts are limited to `app.documenso.com`; self-hosted Documenso instances are not supported yet. File upload for document creation uses presigned URLs, which are outside the API origin and are not reachable through the tools.

Icon: Documenso's official logo icon (PNG from the documenso/documenso repository).
