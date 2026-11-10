# Api2Pdf

Generate PDFs and images from HTML, URLs and markdown (Headless Chrome, wkhtmltopdf), convert Office documents and emails with LibreOffice, merge, extract, watermark and password-protect PDFs (PdfSharp), convert files to markdown, generate barcodes, zip files, check balance and delete generated files.

Interface: OpenAPI, from the vendor's official document at https://v2.api2pdf.com/swagger/v2/swagger.json (28 operations, all on `https://v2.api2pdf.com`). Docs: https://www.api2pdf.com/documentation/v2/.

## Auth

- API key: create an account at https://portal.api2pdf.com/register and copy the key from the portal. It is sent in the `Authorization` header. Api2Pdf has no OAuth.

## Known gaps

- The vendor also offers an MCP server and x402 pay-per-call access; neither is used here.
- Generated files are returned as URLs (`FileUrl`) that expire; download them promptly.
- The icon is the official api2pdf wordmark (the vendor publishes no standalone mark or SVG), taken from its GitHub organization avatar and flattened onto white so it reads on dark backgrounds.
