# SignWell

Create, send, track and download e-signature documents with SignWell: documents, templates, bulk sends, API applications and webhooks (26 tools).

**Interface:** hand-written tools over SignWell's official REST API v1 (`https://www.signwell.com/api/v1`, reference at https://developers.signwell.com/reference). SignWell publishes its OpenAPI definition only embedded in each docs page, with no stable document URL, so a live OpenAPI source is not possible; the tools are one per documented endpoint. Request bodies and query strings are passed through as JSON, with the fields described in the vendor docs. SignWell's MCP server is local stdio only, so it is not used.

**Auth:** API key. In SignWell open Settings > API, create a key, and paste it when connecting. It is sent as the `X-Api-Key` header. SignWell has no user-created OAuth apps for this API, so only the key is offered. Use `test_mode: true` on create calls to avoid consuming documents.

Mutations require approval.

**Binary downloads:** `documents.completedPdf` and `documents.nom151Certificate` return a PDF/ZIP when `url_only` is false (the default). Non-JSON responses are returned as `{ contentType, encoding: "base64", content }`; pass `url_only: true` to get a download URL instead, which is better for large files.

**Known gaps:** no tool lists documents or API applications, because the public API documents neither endpoint. Event webhooks are registered with `webhooks.create` but incoming events are not handled. Icon: the SignWell S mark, taken from the vendor's docs-site favicon SVG (matches the glyph in SignWell's own logo).
