# DocuPipe

Document AI: upload and parse documents, define schemas, extract structured data (standardization), classify, review, transform, run workflows, manage webhooks and datasets.

Interface: OpenAPI, from DocuPipe's official FastAPI document at https://app.docupipe.ai/openapi.json (API base https://app.docupipe.ai).

Auth: API key (`apiKey`), sent as the `X-API-Key` header. Create it in the DocuPipe dashboard (https://www.docupipe.ai/dashboard). The spec also declares an undocumented HTTPBearer alternative; it is intentionally not used. DocuPipe offers no OAuth for third-party apps.

Known gaps: none known; all 93 operations compile. `document.postDocument` takes the file as base64 or a URL in a JSON body, and `document.createPresignedUploadUrl` is exposed too. `document.downloadPublicUrl` (GET) creates a permanent public link to a document but is not approval-gated, because the approval predicate only sees the operation kind; accepted risk. The health check treats HTTP 402 (out of credits) as authenticated.
