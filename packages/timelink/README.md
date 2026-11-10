# Timelink

Time tracking with timelink: clients, projects, services, time entries (including
the active entry, conflicts and export), users, company settings and webhooks.

**Interface:** OpenAPI 3.0, the vendor's official document served at
https://api.timelink.io/docs (base URL `https://api.timelink.io/api/v1`).

**Auth:** API key sent as a bearer token (the OpenAPI document declares an http
bearer security scheme). timelink's public documentation does not say where in the
app to create an API key; ask timelink support or check your account settings. The
health check calls `GET /token`. timelink offers no user-created OAuth apps.

**Document fixes:** the vendor document has two defects, patched in `openapi.ts`.
`PUT` and `PATCH /timeEntries/ext{ext-id}` (missing slash; the real path defines only
`GET` and `DELETE`) are removed because they cannot work. `DELETE /hooks/{id}/unsubscribe`
declares its path parameter with `in: null`, which the compiler rejects, so the
parameter is rewritten as a path parameter and the tool is exposed.

**Known gaps:** image upload operations take multipart bodies and may be limited.
