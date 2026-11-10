# Easy Email Verification

Email verification with Easy Email Verification: verify a single address, verify batches of up to 50, create, monitor, download and delete asynchronous bulk list jobs, and read the credit balance.

**Interface:** the vendor's official OpenAPI 3 document at https://www.easyemailverification.com/openapi.json (API reference: https://www.easyemailverification.com/docs/api-reference.md). Every operation is exposed. Mutations (batch verify, bulk upload, bulk delete) require approval.

**Auth:** API key only. Create one in the dashboard under API Settings (https://dashboard.easyemailverification.com/apisettings). It is sent in the `X-API-Key` header. Widget keys (tied to an authorized domain) are rejected by the API. The service has no OAuth. The health check reads `/credits`.

**Gaps:** the bulk upload takes a multipart file, which may not be practical from every client. Verification calls consume credits.
