# 0CodeKit

Utility APIs from [0CodeKit](https://www.0codekit.com): AI (OCR, entity and language detection, background removal, image generation, transcription), PDF and Factur-X, image, text and data conversion, calculation, crypto, date and time, charts, QR/barcodes and generation, URL shortening, permanent and temporary storage, schedulers and credit lookup.

## Interface

OpenAPI. The 0CodeKit API reference at https://docs.0codekit.com/api/0-codekit-api/ is generated from the spec served at `https://v2.1saas.co/openapi.json` (OpenAPI 3.0.2, server `https://prod.0codekit.com`). 165 tools are generated, 155 of them mutations (all POST/PUT/DELETE actions, each requiring approval; some read-only POSTs are therefore gated too). The compiler skips `GET /files/{id}/{name?}` (`operation_path`). Three more operations are deliberately omitted: `GET /mcp` and `POST /mcp/messages` (SSE transport for 0CodeKit's own MCP server; `GET /mcp` returns an endless `text/event-stream`, so a tool call would hang) and `POST /mcp/call` (a proxy to the other endpoints that needs HTTP Bearer auth; this package binds only the `auth` header, and the vendor does not document that the API key works as a bearer token). The vendor also runs an MCP server at `https://prod.0codekit.com/mcp`; the OpenAPI tools are more complete.

Fifteen operations (`/editor`, `/editor/make`, `/editor/make-variables`, `/storage/perm/*`, `/resource/*`) are declared in the spec with `security: []` and a required `auth` header parameter. A spec patch in `openapi.ts` rebinds them to the `apiKeyAuth` scheme and drops the parameter, so the account's key is injected at call time and never appears in tool input.

## Auth

API key. Sign up at https://www.0codekit.com and create or copy the key from your account (the docs do not name the exact page) and paste it as the API key; it is sent in the `auth` header as 0CodeKit documents. 0CodeKit has no OAuth. Most operations consume account credits.

## Known gaps

- The spec also documents HTTP Bearer auth, used only by `POST /mcp/call`; it is omitted (see above).
- The spec is hosted on 0CodeKit's own `1saas.co` domain, the product's legacy name; the docs page does not link it.
- The icon is hand-traced from the vendor's PNG logo (https://docs.0codekit.com/img/logo.png); the vendor publishes no SVG.
