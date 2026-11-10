# Magnetic

Magnetic is a professional services automation platform. This package covers its REST API: client companies and contacts (with comments/records and tags), groupings (projects and opportunities, with statuses, tags, custom fields and comments), tasks (create, track time, comments), users and notifications.

Interface: hand-written tools over Magnetic's REST API at `https://app.magnetichq.com/v2/rest` (`coreAPI`, `clientsAPI`, `tasksAPI`). The older `/Magnetic/rest` base answers 301 to `/v2/rest`, which would turn redirected writes into GETs, so the package uses the v2 base directly. Magnetic does not publish an OpenAPI document without logging in (`/v2/rest/openapi/json` returns 401), and its API page at https://app.magnetichq.com/Magnetic/API.do is behind login. Endpoint paths and query parameters come from Magnetic's own Jersey-generated WADL at https://app.magnetichq.com/v2/rest/application.wadl?detail=true. Tool names are descriptive and are mapped to WADL method ids in the code (for example `listCompanies` calls `getCompanies`).

Auth: API token (`apiKey`). The v2 WADL documents the token only as a `token` query parameter, so every request sends it that way and no Authorization header is sent. Where to create the token in Magnetic (likely user/security settings) and whether every endpoint honors the query token are unverified, because no live account was used. Because the token is in the URL, logs and proxies may capture it; the package never includes request URLs in error messages.

Known gaps:
- Request and response bodies are not documented publicly, so create/update tools take a free-form JSON `body`; fetch an existing record with the matching get tool to see its shape. These tools are untested against a live account.
- Not exposed: login/2FA, billing and Xero/Sage accounting sync, expenses, cost estimates, file upload, workflows, templates, reports, settings and API key management, and other v2-only resources.
