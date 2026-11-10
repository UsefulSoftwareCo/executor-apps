# CraftMyPDF

Generate PDFs and images from CraftMyPDF templates (sync, async, merge, parallel and image export) and manage templates, template versions, and usage.

Interface: OpenAPI, from CraftMyPDF's official document at https://craftmypdf.s3.ap-southeast-1.amazonaws.com/craftmypdf_api/craftmypdf_api.yaml (the spec its API reference at https://craftmypdf.com/docs/ loads). 23 tools, all operations compiled.

Auth: API key only (CraftMyPDF has no OAuth). Copy it from the web console under API Integration at https://craftmypdf.com; it is sent in the `X-API-KEY` header. The spec's securityScheme is `in: header, name: X-API-KEY` and every code sample uses it, but its description prose says "Authorization header"; the rendered docs page could not be read (it returned only its title), so `X-API-KEY` follows the machine-readable scheme and samples. If a key is rejected, check this first.

Known gaps: the tools call the default Singapore endpoint `https://api.craftmypdf.com/v1`. Accounts whose data must stay in the Europe, US East or Australia regions (`api-de`, `api-us`, `api-au`) are not supported yet, since the package allows a single origin.

Icon: the vendor's official SVG (https://craftmypdf.com/media/2024/11/craftmypdf-icon-optimized.svg) is a horizontal wordmark lockup; icon.ts uses its mark-only paths (the three red stripes), cropped.

Health check: calls `GET /v1/list-templates` and requires HTTP success plus a JSON object body; the spec marks no response field as required, so none is decoded.
