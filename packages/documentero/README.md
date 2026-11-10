# Documentero

Document generation with [Documentero](https://documentero.com): merge JSON data into a Word or Excel template you uploaded to Documentero and get back an expiring download link (as .docx, .xlsx or PDF), or have Documentero email the file.

**Interface:** hand-written tools over Documentero's single REST endpoint, `POST https://app.documentero.com/api` (docs: https://docs.documentero.com/documentation/api/integrate-with-documentero-cloud-api). Documentero publishes no OpenAPI document. Two tools: `generateDocument` and `generateAndEmailDocument`, both gated by approval.

**Auth:** API key, sent as `Authorization: apiKey <key>`. Copy it from Account Settings at https://app.documentero.com/admin/account. Documentero has no OAuth.

**Known gaps:** the public API cannot list templates; the template identifier comes from the template's API panel in the app. Errors are returned with HTTP 200, so read `status` and `message` in the response. There is no read-only endpoint that validates a key, so no provider health check is declared.
