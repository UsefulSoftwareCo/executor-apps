# PDF Munk

Generate PDFs and images from HTML or URLs, render pages to HTML, convert PDFs to images and back, run OCR, and compress, watermark, lock and unlock PDFs with [PDF Munk](https://pdfmunk.com).

**Interface:** hand-written tools over PDF Munk's REST API (`https://pdfmunk.com/api/v1`), 15 tools. PDF Munk's API docs page (https://pdfmunk.com/api-docs) links an OpenAPI document at https://pdfmunk.com/openapi/openapi.yaml, but every fetch of it (curl, WebFetch) returns 403 from Cloudflare and the browser route was not approved, so its coverage could not be checked and this package does not use it. Rebuild on that spec if it proves to cover the API. There is no MCP server or GraphQL API. Every call is a POST that creates or processes a file, so all tools ask for approval.

**Sources:** api-docs (https://pdfmunk.com/api-docs) documents generatePdf, generateImage, compressPdf, lockPdf, unlockPdf, watermark, mergePdf (`/pdf/merge`), splitPdf (`/pdf/split`) and parsePdf (`/pdf/parse`). The other six come from product or blog pages, not api-docs: urlToHtml (`/url-to-html`, blog post url-to-html-api-guide), pdfToImage (`/convert/pdf/image`, pdf-to-image page), imageToPdf (`/convert/image/pdf`, image-to-pdf page), pdfOcr (`/pdf/ocr/parse`, pdf-ocr and ocr-api pages), imageOcr (`/image/ocr/parse`, image-ocr page) and deleteFile (`/file/delete`, delete-file page). Their parameters are less authoritative than api-docs.

**Auth:** API key only (PDF Munk has no OAuth). Create one in the [dashboard](https://pdfmunk.com/dashboard); it is sent raw in the `CLIENT-API-KEY` header. PDF Munk has no read-only account endpoint and documents no error codes, so the connection check posts an empty body to `compressPdf` and accepts only HTTP 400 (validation failure, which in observed behavior follows a valid key and happens before any processing); any other status, including 401, 404, 429 and 5xx, fails the check. This behavior is not stated in the vendor docs and was not verified live (no test key).

**Known gaps:** multipart upload is not exposed; tools take public URLs or inline base64. The openapi.yaml above is unverified. The tools were not called live.
