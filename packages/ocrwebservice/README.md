# OCR Web Service

OCR for scanned documents and images through OCR Web Service (https://www.ocrwebservice.com): extract text (optionally word coordinates and zonal OCR), produce converted output files (one or two of pdf, pdfimg, doc, docx, xls, xlsx, rtf, txt; validated before any page is consumed) and check the account's remaining pages.

**Interface:** hand-written tools over the vendor's official REST API, documented at https://www.ocrwebservice.com/api/restguide (`POST /restservices/processDocument`, `GET /restservices/getAccountInformation`). The vendor publishes no OpenAPI document and no remote MCP server. The vendor's SOAP-only account log operation is not exposed.

**Auth:** API key only, as HTTP Basic: the account user name and the license code, both from the account page after registering at https://www.ocrwebservice.com. Credentials go only to `www.ocrwebservice.com`. The health check calls `getAccountInformation`, which does not consume pages.

**Tools:** `account.information` (read) and `ocr.processDocument` (requires approval; consumes plan pages). The file is passed as base64 in the tool input; `contentType` defaults to `application/octet-stream`.

**Known gaps:** no OAuth (the service has none); no log endpoint (SOAP only); no file URL input, files must be sent as base64.

**Icon:** BLOCKED. The vendor publishes no logo: the site favicon (/images/favicon.ico) is 16x16 only and the header banner is decorative art, not the product mark. `icon.ts` is a temporary placeholder traced from the banner and must be replaced when an official 128px+ mark is available.
