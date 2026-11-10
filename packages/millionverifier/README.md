# MillionVerifier

Email verification with MillionVerifier: real-time single-address verification, credit balance, and the bulk API (upload a list, follow progress, list files, download the report, stop or delete a file).

**Interface:** hand-written tools over the documented API (reference at https://developer.millionverifier.com/). The vendor's OpenAPI document is only embedded in its Redoc page and has no stable download URL, and it has no remote MCP server or GraphQL API, so all eight documented operations are wrapped directly: `verifyEmail`, `getCredits`, `bulkUpload`, `bulkFileInfo`, `bulkFileList`, `bulkDownload`, `bulkStop`, `bulkDelete`. The single API is on `api.millionverifier.com` and the bulk API on `bulkapi.millionverifier.com`. Upload, stop and delete require approval.

**Auth:** API key only (MillionVerifier has no OAuth). Create or copy it at https://app.millionverifier.com/api. It is sent as a query parameter, `api` for the single API and `key` for the bulk API.

**Icon:** the check-and-bars mark taken from the vendor's official logo SVG (`https://www.millionverifier.com/assets/images/mv_logo.svg`), without the wordmark. Simple Icons has no entry.

**Known gaps:** `bulkDownload` returns the CSV as text in a `body` field. `bulkUpload` takes the file contents as a string. The health check calls the credits endpoint. Real-time verification and bulk jobs consume credits.
