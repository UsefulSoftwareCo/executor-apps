# Extracta.ai

AI document data extraction and classification: extraction templates, document classifications, file uploads, batch results and remaining credits (15 tools).

**Interface:** hand-written tools over Extracta's REST API at `https://api.extracta.ai/api/v1`, following the vendor docs at https://docs.extracta.ai. Extracta publishes no OpenAPI document, MCP server or GraphQL API.

**Auth:** API key only (Extracta has no OAuth). Generate one at https://app.extracta.ai/api ("Generate a new API Key"); it is sent as `Authorization: Bearer <key>` to `api.extracta.ai`. The connection health check reads `GET /credits`.

**Notes and gaps:**
- Uploads take files as base64 content (`name`, `contentBase64`, optional `mimeType`) and send them as multipart form data.
- `getResults` returns `status: "waiting"` while processing; the docs ask for at least 2 seconds between calls.
- Webhooks are not covered (they are configured on the extraction template, not a callable endpoint).
- Every mutation, including deletes (permanent), requires approval.
- The icon is Extracta's site app icon (192px PNG shortcut/apple-touch icon, not the header wordmark; no SVG is published).

Note: the health check returns the constant externalId "extracta" because `/credits` exposes no account id, so every Extracta key maps to one account identity.
