# Clio Manage

Clio Manage legal practice management: contacts, matters, activities and time entries, calendar entries, tasks, bills, trust accounting, documents, communications and custom fields.

Interface: OpenAPI, Clio's official Manage API v4 document at https://docs.developers.clio.com/openapi.json (317 tools, 162 mutations, all mutations require approval). The document declares no security schemes, so bearer auth is applied by the package. Clio Grow is a separate API and is not covered.

Auth: OAuth 2.0 only (Clio offers no API keys). Register an application in the regional Clio Manage developer portal (https://developers.clio.com for US, eu./ca./au.developers.clio.com for the others) and add the redirect URI shown on the Executor connect page to the application's redirect URLs; Clio requires it to match exactly. Clio apps and accounts are region-specific, so there is one OAuth method per region: `oauth` (US, app.clio.com), `oauthEu`, `oauthCa`, `oauthAu`. Use the method for the region where the app was registered. Clio sends no scope parameter; the access permissions (its OAuth scopes) are selected on the application and shown to the user at consent.

Verified against Clio's docs (https://docs.developers.clio.com/api-docs/clio-manage/authorization/, /applications/, /permissions/ and the Handbook regions page): authorize at `https://<region host>/oauth/authorize` with response_type=code, client_id, redirect_uri and state; token exchange is a POST to `/oauth/token` with client_id, client_secret, grant_type, code and redirect_uri in the form body (hence client_secret_post); tokens last 30 days, are refreshable and are only valid in their own region.

Known gaps: the official document is large and may list fields Clio only returns when requested through the `fields` parameter.
