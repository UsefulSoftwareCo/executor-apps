# OCR.space

Text extraction from images and PDFs with the OCR.space API: parse a file by URL
or base64 (language selection, engines 1-3, word overlays, table mode, orientation
detection, searchable PDF output) and read the account's monthly conversion counters.

Interface: hand-written tools over the documented REST API (https://ocr.space/ocrapi).
OCR.space publishes no OpenAPI document, GraphQL API or MCP server. Parse calls go to
`api.ocr.space`; statistics go to `myapi.ocr.space`. Both parse tools use the documented `POST /parse/image` as
multipart/form-data (URL input via the `url` field, base64 via `base64Image`) with the key in the
`apikey` header, never in the URL. The GET `/parse/imageurl` form is not used because the vendor
documents the key there only as a query parameter.

Auth: API key only (`apiKey`). Register for a free key at https://ocr.space/ocrapi/freekey;
paid keys come from the PRO plans. OCR.space has no OAuth.

Known gaps: multipart file upload is not exposed (use `parseBase64Image` or a URL).
PRO/PRO PDF accounts get dedicated regional parse endpoints; this package always uses
`api.ocr.space`. The health check calls the statistics endpoint (free) rather than
parsing, which would spend quota; the statistics endpoint is not covered by the public docs.


The health check and `conversions` tool POST to `myapi.ocr.space/conversions`, which the vendor does
not document (the public API has no usage or account endpoint); it was not exercised with a live key
here. Parse results are treated as successful only when OCRExitCode is 1 or 2 and at least one page
has FileParseExitCode 1. The icon is cropped from the official 232x38 wordmark PNG and upscaled
because the vendor publishes no SVG or larger mark.
