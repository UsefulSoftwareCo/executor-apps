# CentralStationCRM

Covers CentralStationCRM's REST API: people, companies, deals, projects, tasks, notes, tags, calendar events, attachments, users and more (198 operations).

**Interface:** OpenAPI 3.0, the vendor's official document at https://api.centralstationcrm.net/api-docs/v1/swagger.json (Swagger UI: https://api.centralstationcrm.net/api-docs/index.html, overview: https://centralstationcrm.com/api-basics). The document names a generic server, but every account is served from `https://<account>.centralstationcrm.net`, so the package rewrites the origin from the account's subdomain.

**Auth:** API key only. Any user creates one under "My settings" in CentralStationCRM; the package sends it in the `X-apikey` header. Enter the account subdomain (the `<account>` in `<account>.centralstationcrm.net`) and the key. The health check calls `/api/check_connection`. Mutations require approval.

**Known gaps:** One operation is skipped because its schema uses an unsupported keyword. The spec lists the header key, query key and OAuth schemes as one combined requirement; the package patches each affected operation to require only the `X-apikey` header. The API documents an OAuth bearer flow but offers no self-service way to create OAuth apps, so it is not offered. The API is rate limited to 50 requests per 10 seconds.
