# Parsio

Parsio extracts structured data from emails, PDFs, images and other documents. This package covers mailboxes (list, get, create, update, delete, table fields, collected emails), documents (list, get, parsed data, create from text or HTML, upload, reparse, skip), templates (list, get, enable, disable, clone, delete) and webhooks (list, get, create, update, delete). 27 tools.

**Interface:** hand-written tools over Parsio's official REST API at `https://api.parsio.io`, documented at https://help.parsio.io/public-api/parsio-public-api. Parsio publishes no OpenAPI document (only a Postman collection) and no remote MCP server that was found, so the tools are written by hand.

**Auth:** API key. Copy it from https://app.parsio.io/account. It is sent in the `X-API-Key` header to `api.parsio.io`. The API has no OAuth.

**Notes:** files are uploaded as base64 strings and sent as multipart form data with a `file` field and an optional JSON `meta` field, per https://help.parsio.io/public-api/parse-pdf-and-files-using-api-1. Text and HTML documents (`createFromText`, `createFromTextAndParse`) take JSON bodies with `name`, `html`, `text`, `from`, `to` and `meta`, per https://help.parsio.io/public-api/parse-html-and-text-documents-using-api-1. Every mutation requires approval. Deletes with an empty response body return `{ "deleted": true }`; any other body is decoded as JSON and a non-JSON body is an error.

**Icon:** Parsio's own app icon (https://parsio.io/i/android-chrome-192x192.png), since the vendor's published SVG is a wordmark only.

**Known gaps:** the vendor documents parameter names but not request or response schemas, so results are returned as raw JSON. Accepted values for mailbox `preset` and `mlModel` are not documented. The multi-value encoding of the `status` filter on `documents.list` is not documented; repeated keys are sent and are unconfirmed.
