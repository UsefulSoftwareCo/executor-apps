# TimeCamp

Time tracking with TimeCamp: time entries, timers, projects and tasks, users and groups, tags and tag lists, approvals, attendance, billing rates, expenses, custom fields, data exports and activity categories.

**Interface:** OpenAPI. TimeCamp publishes its own OpenAPI 3.0 document at https://developer.timecamp.com/reference/dist/api-prod.yaml (docs at https://developer.timecamp.com/). It yields 157 tools (100 mutations, each requiring approval), 0 skipped. The document also lists https://v4.api.timecamp.com as a second server; all operations are served from `https://app.timecamp.com/third_party/api`, which is the only origin used.

**Auth:** API token only. Each user copies it from their profile page, https://app.timecamp.com/app#/settings/users/me, and it is sent as `Authorization: Bearer <token>` to `app.timecamp.com`. The document declares an OIDC scheme but no public OAuth client registration was found in the developer docs, so the API token is the only supported method and the OIDC scheme is not exposed.

**Known gaps:**
- Responses of several v1 endpoints use `format` path variants (json/xml/csv); JSON is what tools return.
- Rate limits depend on the subscription plan (HTTP 429 when exceeded).
- The app icon is TimeCamp's official 153px PNG logo (https://cdn-y.timecamp.com/img/timecamp-logo-152x152.png); it has a dark background tile.
