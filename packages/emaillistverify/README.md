# EmailListVerify

Email verification and list cleaning with EmailListVerify: verify a single address (basic or detailed), create and download bulk verification jobs and uploaded lists, find contacts, check disposable domains and blacklists, run inbox placement tests, and read the credit balance.

**Interface:** the vendor's official OpenAPI 3 document, served by the API itself at https://api.emaillistverify.com/api-doc-json (Swagger UI at https://api.emaillistverify.com/api-doc). Every operation in the document is exposed. POST and DELETE operations (including the POST-based checks, which consume credits) require approval.

**Auth:** API key only. Create one in the EmailListVerify dashboard under API (https://app.emaillistverify.com/). It is sent in the `x-api-key` header. The service has no OAuth. The health check reads `/api/credits`.

**Gaps:** none known. Many operations consume credits; the single-verify endpoints return plain text statuses (`error_credit` means insufficient balance).
