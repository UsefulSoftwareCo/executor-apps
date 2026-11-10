# DocRaptor

HTML-to-PDF/XLS/XLSX conversion with DocRaptor: create documents synchronously, asynchronously or hosted, poll status, download finished documents and expire hosted ones.

**Interface:** OpenAPI. DocRaptor's own client-generation spec (Swagger 2.0), published in its official repository: https://github.com/DocRaptor/docraptor-swagger (`docraptor.yaml`), pinned to commit `ebbd192`. It covers 7 operations. The spec declares host `docraptor.com`, but the vendor's docs (https://docraptor.com/documentation/api/making_documents) put the API at `https://api.docraptor.com`, so the package overrides the server and sends credentials only to `api.docraptor.com`.

**Auth:** API key, found in your DocRaptor account settings (no verified direct link). It is sent as the HTTP Basic username with an empty password. DocRaptor offers no OAuth. Per the vendor's test-mode docs, the placeholder key `YOUR_API_KEY_HERE` works in test mode.

**Health check:** `GET https://api.docraptor.com/docs.json?per_page=1` (Document Listing, read-only). Only a 401 is treated as a bad key, since the vendor also returns 403 for refused requests on valid keys.

**Known gaps:** The vendor documents a Document Listing API (`GET /docs.json`, `/docs.xml`, with `page` and `per_page`) and an IP listing (`GET https://docraptor.com/ips.json`, `ips.txt`); neither is in the spec, so neither is a tool. Binary document responses from synchronous creation may be best consumed via the async or hosted variants. Whether DocRaptor publishes an official remote MCP server was not checked.
