# Veryfi OCR

Extract structured data from receipts, invoices, bank statements, checks, W-2, W-9 and W-8BEN-E forms, business cards and custom-blueprint documents with Veryfi. Tools cover processing (by URL or base64 file), listing and reading results, editing documents, line items and tags, splitting multi-document PDFs, and classifying documents.

## Interface

Hand-written tools (51) over the Veryfi REST API v8, `https://api.veryfi.com/api/v8/partner`. Veryfi publishes no OpenAPI document or MCP server, so the endpoints and request fields come from the vendor's API docs (https://docs.veryfi.com/api/) and its official SDK (https://github.com/veryfi/veryfi-python).

## Auth

API credentials (`apiKey`): create them in the Veryfi Hub under Settings > Keys (https://hub.veryfi.com/api/settings/keys/). Enter three values: Client ID, username and API key. They are sent as the `Client-Id` header and `Authorization: apikey <username>:<api key>`. Veryfi has no OAuth for API access.

## Known gaps

- The optional request-signing headers (`X-Veryfi-Request-Signature`, derived from the client secret) are not sent; the standard keys do not require them.
- Veryfi documents no response body for several DELETE calls; an empty success is returned as `{ ok: true }`.
- Optional extra body fields for processing calls go in the `extra` JSON object.
