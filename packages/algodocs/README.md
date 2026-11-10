# Algodocs

Covers the AlgoDocs REST API for AI document data extraction: check the account, list extractors and folders, upload documents by public URL or base64 content, and read the extracted data for one document or for every document an extractor has processed. Upload tools require approval.

**Interface:** custom tools written with `fetch` against the official API at `https://api.algodocs.com/v1`, following the vendor's reference at https://api.algodocs.com/. AlgoDocs publishes no OpenAPI document (the only one in circulation is a third-party listing with paths that differ from the real API, so it is not used). Tools: `me`, `listExtractors`, `listFolders`, `uploadDocumentFromUrl`, `uploadDocumentBase64`, `getExtractedDataByDocument`, `getExtractedDataByExtractor`.

**Auth:** API key, sent as the `x-api-key` header. Create a secret key at https://app.algodocs.com/restapi. AlgoDocs also accepts HTTP Basic auth with `email:api_key`, which is equivalent, so only the header form is offered. AlgoDocs has no OAuth. The health check calls `GET /me`.

**Known gaps:** the multipart local-file upload (`upload_local`) is not exposed because tools take JSON, not file handles; use the base64 upload instead. Extraction is asynchronous, so `getExtractedDataByDocument` returns an empty `data` until processing finishes. The reference does not document HTTP error codes, and `GET /extracted_data/{id}` is the same path for document ids and extractor ids (the two tools use it for each case). The logo is the vendor's own SVG served by app.algodocs.com.
