# D2L Brightspace

D2L Brightspace learning management system: users and roles, org units and courses, enrollments, groups, course content, grades, announcements, discussions, assignment folders, quizzes, classlist and calendar events.

**Interface:** custom, hand-written tools over the Brightspace Valence REST API (`https://<tenant>.brightspace.com/d2l/api/{lp|le}/<version>/...`, reference at https://docs.valence.desire2learn.com/reference.html). The Valence developer reference documents routes only as an HTML reference, and I found no official OpenAPI document, GraphQL API or remote MCP server from D2L (an absence I could not confirm with a vendor statement, so treat it as unverified), so 76 commonly used routes are declared by hand and spot-checked against the Valence reference pages (LP API 1.49, LE API 1.82: the oldest fully supported contracts in the [deprecation table](https://docs.valence.desire2learn.com/about.html); call `system.listVersions` to see what your instance supports). The `users/whoami` route used for the health check exists from LP 1.49. Reads are queries; every mutation requires approval.

**Auth:** a bearer access token plus the tenant host. Brightspace OAuth 2.0 apps are registered per tenant by an administrator (Manage Extensibility; authorization endpoint `https://auth.brightspace.com/oauth2/auth`, token endpoint `https://auth.brightspace.com/core/connect/token`) and every API call goes to the tenant's own host. Executor's OAuth accounts carry no per-account host, so OAuth sign-in is not offered; instead obtain an access token from your registered app (scopes such as `core:*:*`, access token lifetime 30 minutes to 20 hours; send it as `Authorization: Bearer`) and enter it with the host (for example `school.brightspace.com`). The token is sent only to `*.brightspace.com`. Tenants using a custom domain cannot be connected, and tokens must be replaced when they expire.

**Known gaps:**
- No OAuth sign-in or refresh (see above); no legacy ID/Key signing.
- File uploads and downloads (content files, dropbox submissions) are not covered.
- Data Hub / Brightspace Data Sets, competencies, rubrics, checklists, surveys, SCORM, attendance and course copy jobs are not covered.
- Route versions are fixed at LP 1.49 / LE 1.82; routes introduced later are not used. Tenants older than Suite 20.24 may not serve them.
- The icon is the flame A of the BRIGHTSPACE wordmark from D2L's official branding library (`https://s.brightspace.com/lib/branding/1.0.0/brightspace/logo-black.svg`), cropped and drawn white on an orange tile. D2L publishes no standalone Brightspace symbol that I could find.
