# PDF4me

Convert, merge, split, compress, protect, stamp, OCR and extract data from PDF, Word, Excel and image files, generate documents from templates, and create or read barcodes and Swiss QR bills with the PDF4me API.

## Interface

Hand-written tools over the REST API at `https://api.pdf4me.com/api/v2/<Operation>` (JSON `POST`), taken from the vendor's documentation at https://docs.pdf4me.com/pdf4me-api/ and its official samples at https://github.com/pdf4me/pdf4me-api-samples. PDF4me's Swagger page (`api.pdf4me.com/swagger`) does not serve a downloadable document (the JSON endpoint returns 500), and its MCP server is a local `uvx pdf4me-mcp` process rather than a remote URL, so neither could be used. The tools are grouped as `pdf`, `convert`, `extract`, `word`, `image` and `barcode`.

Files travel as base64 strings (`docContent` plus the file name in `docName`). A tool returns the output file as `{ contentType, sizeBytes, contentBase64 }`, or the JSON the API produces for data endpoints (metadata, tables, barcodes). Requests are sent synchronously; when the API answers 202 the tool polls the `Location` URL for up to about two and a half minutes.

Tools that produce a file require approval because they spend PDF4me credits; read and extraction tools do not.

## Auth

API key. Create one in the PDF4me dashboard at https://dev.pdf4me.com/dashboard/#/api-keys. It is sent as `Authorization: Basic <key>`. PDF4me offers no OAuth for API access.

The account health check posts an empty body to `GetPdfMetadata`: a valid key is answered with 400, a bad key with 401. PDF4me has no account or usage endpoint.

## Known gaps

- Whole documents pass through the tool call as base64, so large files are impractical.
- Enumerated option values (split actions, optimize profiles, rotation types) are described as examples; the vendor does not publish a machine-readable schema.
- Not covered: Excel worksheet and row editing, Word merge/split/compare/watermark/headers, PDF header/footer from image, extract-pages-by-text variants and other operations that the documentation lists but whose request shape is not in the official samples.
