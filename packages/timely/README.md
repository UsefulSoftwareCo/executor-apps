# Timely

Time entries, projects, clients, labels, teams, forecasts, reports, users and the rest of the Timely time-tracking API (79 OpenAPI tools, 44 of them mutations that always ask for approval, plus a hand-written `accounts.list`).

**Interface:** OpenAPI 3.1 from Timely's own developer portal, https://developer.timely.com/ (also https://dev.timelyapp.com/). The portal embeds the document in the page and publishes no stable file URL, so a copy is vendored as `spec.json` and loaded as an inline document. The `/webhook-events` path (documentation only) and the `/1.1/oauth/*` endpoints other than `token/info` (OAuth plumbing driven by Executor) are filtered out in `openapi.ts`, and local dev server URLs were replaced with the production host. Refresh it by re-extracting the `application/json` script block from the portal page. Requests go to `https://api.timelyapp.com`.

**Auth:** OAuth 2.0 only; Timely has no personal API tokens. An account admin creates an OAuth application at `https://app.timelyapp.com/<account_id>/oauth_applications`, then enters its client id and secret on the connect page. Register Executor's callback as the application's redirect URI. Scope `manage` is requested because the spec's root and per-operation security require it. Token requests are sent as JSON (`tokenRequestFormat: "json"`) with client credentials in the body, matching the `application/json` body the spec declares for `POST /1.1/oauth/token`; not tested against live Timely. Health check calls `GET /1.1/oauth/token/info`.

**Account discovery:** `accounts.list` calls `GET /1.1/accounts`, which the spec's own text says to use to get account ids but which is absent from the spec. It decodes only `id` and optional `name`; the response shape is not documented in the spec, so this is unverified against live Timely.

**Known gaps:** most tools take an `account_id` (workspace id) path parameter; get it from `accounts.list`.
