# Emailvalidation

Validates email addresses with emailvalidation.io: single-address deliverability checks (syntax, MX, SMTP, disposable, role, free-provider, score, status and recommended action), asynchronous bulk list verification jobs (create, list, get, delete, download results) and account quota status.

Interface: OpenAPI 3.1, the vendor's official document at https://emailvalidation.io/docs/openapi.yaml (server `https://api.emailvalidation.io`). Every mutation (creating or deleting bulk jobs) requires approval.

Auth: API key. Create one in the emailvalidation.io dashboard (https://app.emailvalidation.io, register at https://app.emailvalidation.io/register). It is sent in the `apikey` request header. The vendor offers no OAuth.

Icon: the vendor's official app icon (https://emailvalidation.io/img/favicon/android-icon-192x192.png).

Known gaps: the bulk-finished webhook is a callback in the spec, not a tool. Catch-all detection needs a paid plan.
