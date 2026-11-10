# Airparser

Airparser extracts structured data from emails, PDFs, images, spreadsheets and other documents using AI. This package covers inboxes (list, get, create, delete), extraction schemas (set, clone) and documents (upload with or without waiting, list, get, get extended).

**Interface:** hand-written tools over Airparser's official REST API at `https://api.airparser.com`, documented at https://help.airparser.com/public-api/public-api. Airparser publishes no OpenAPI document (only a Postman collection), so the tools are written by hand. Airparser also runs an official remote MCP server at `https://mcp.airparser.com`. It was considered and rejected: `node scripts/mcp-probe.ts https://mcp.airparser.com` returns 401 with OAuth protected-resource metadata (authorization server `https://mcp.airparser.com`, registration endpoint `https://mcp.airparser.com/oauth/register`, no client-id metadata document support), so its tool list cannot be inspected without an Airparser account. Because the tool surface is unverifiable, the package uses the documented REST API, and the possible loss of the MCP's post-processing tools is accepted.

**Auth:** API key. Copy it from https://app.airparser.com/account. It is sent in the `X-API-Key` header to `api.airparser.com`. The REST API has no OAuth.

**Notes:** files are uploaded as base64 strings and sent as multipart form data. Six mutations require approval: `inboxes.create`, `inboxes.delete`, `schema.set`, `schema.clone`, `documents.upload` and `documents.uploadAndParse`. `schema.set` validates the `{ type, data }` field envelope before the request is sent. `schema.clone` returns the vendor's boolean. The vendor documents no response body for `inboxes.delete`, so an empty success body is returned as `{ "deleted": true }`.

**Icon:** Airparser's official mark (https://airparser.com/logos/airparser.png) redrawn as SVG, because the vendor publishes no SVG.

**Known gaps:** webhook configuration and post-processing steps are not part of the public REST API, so they are not exposed (the MCP server reportedly offers post-processing tools). The create-inbox response shape is not documented.

**Unverified:** the vendor does not document how the `documents.list` `status` array is encoded. The vendor's Postman collection only shows a single `status=parsed`, so the tool sends repeated `status` keys; multi-value filtering is unconfirmed.
