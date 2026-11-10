# Memberspot

Manage a Memberspot school: list and find users, grant or revoke offers and orders, set offer expiry, read course progress, enable chapter access, list courses, offers and exams with results, manage custom user properties and create login tokens.

Interface: OpenAPI, from Memberspot's official document at https://api.memberspot.de/api-json (Swagger UI at https://api.memberspot.de/api). The document lists no `servers`, so `openapi.ts` sets the base URL `https://api.memberspot.de` explicitly.

Auth: API key only. Memberspot has no OAuth. In your school, open the API key menu (`/settings/apikeys` in the Memberspot app, per the API spec) and create an API key; the secret is shown once. It is sent in the `X-API-KEY` header.

Known gaps: the API covers users, offers, courses, chapters, exams and custom properties only; all mutations require approval.

Approvals: every write (POST, PATCH, DELETE) requires approval, as does the read-only-by-method `users.usersApiControllerCreateLoginTokenV1`, because it mints a one-hour sign-in token for a user.
