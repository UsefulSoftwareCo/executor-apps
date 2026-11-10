# Eagle Doc

Document AI with Eagle Doc: receipt OCR (v3), invoice OCR, any-document extraction (bank statements,
passports, resumes, delivery sheets and more, v1 plain values and v2 grounded values), classification,
page splitting, asynchronous batch tasks and quota/usage reporting. 14 tools.

Interface: hand-written tools over the documented REST API (https://www.eagle-doc.com/en/documentation/).
Eagle Doc publishes no OpenAPI document, GraphQL API or MCP server. All calls go to `de.eagle-doc.com`
(the host in the vendor's curl example) with the key in the `api-key` header. Extraction endpoints take
multipart uploads; each tool accepts `files` as base64 content or a URL the tool downloads first.

Auth: API key only (`apiKey`). Keys come with an Eagle Doc subscription (https://www.eagle-doc.com).
There is no OAuth. The health check calls `GET /api/management/v1/quota`, which does not spend pages.

Notes: the vendor also links a Postman collection from its tools page; it is not an OpenAPI document and was
not used. Synchronous OCR tools are mutations with approval because each call spends pages and
`saveResult`/`privacy=false` store the file at the vendor. The sync any-doc `docType` spells `EmployeeIdCard` and
`StudentIdCard`, while the batch endpoint docs spell `EmployeeIDCard` and `StudentIDCard`. Values are
case-sensitive and the docs disagree, so confirm the spelling with a live key.

Known gaps: the Human Feedback section, the invoice base64 endpoint (POST /api/invoice/v1/base64/processing) and the Business API (clients, RAG)
and the bookkeeping partner API are not covered. Extraction calls spend pages from the subscription.
Nothing was exercised against a live key.
