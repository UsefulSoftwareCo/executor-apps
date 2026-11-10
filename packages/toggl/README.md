# Toggl Track

Time tracking in Toggl Track: the current user, time entries, projects, clients, tags, tasks, workspaces and members, groups, organizations and invitations, Reports API v3 and Insights (detailed, summary, weekly, profitability and trends reports, filters and exports), and webhook subscriptions.

**Interface:** OpenAPI. Toggl publishes three official Swagger 2.0 documents on https://engineering.toggl.com/docs/track/openapi/, and the app mounts each as its own router (`openapi.ts`):

- `track`: Track API v9, https://engineering.toggl.com/assets/files/api-fb7996e774ae61b08ea11c9c1b2f32ef.json (283 tools, 160 of them writes).
- `reports`: Reports API v3 and Insights, https://engineering.toggl.com/assets/files/reports-c9bb77e23d0637e43ddfd60a0134437d.json (32 tools).
- `webhooks`: Webhooks API v1, https://engineering.toggl.com/assets/files/webhooks-479d375ba167e9f885df9356e34a7c4e.json (10 tools, 5 of them writes).

The Track API document declares the placeholder server `localhost:8080` with basePath `/api/v9`, and the other two declare no server, so every origin is set explicitly to `https://api.track.toggl.com` (`/api/v9`, the root for Reports whose paths already start with `/reports/api/v3` or `/insights/api/v1`, and `/webhooks/api/v1`). Every write requires approval. All Reports operations are POSTs that only read data, so they are classified as queries and need no approval.

**Auth:** API token. In Toggl Track open Profile settings and copy the API token at the bottom (https://engineering.toggl.com/docs/authentication). Toggl wants HTTP Basic auth with the token as username and the literal `api_token` as password; no account field holds that literal, so the app binds the token as the Basic username and rewrites the `Authorization` header on outgoing requests to `Basic base64(<token>:api_token)`. Requests go only to `api.track.toggl.com`. Toggl Track has no user-created OAuth apps, so OAuth is not offered.

**Rate limits:** Toggl enforces a sliding one-hour quota, per user per organization. Workspace and organization endpoints allow 30 requests per hour on the Free plan (240 Starter, 600 Premium). User-specific endpoints such as `/api/v9/me` allow 30 requests per hour per user on Free, Starter and Premium. Exceeding the hourly quota returns HTTP 402. A separate short-term leaky bucket (about 1 request per second per API token and IP) returns HTTP 429. Source: https://support.toggl.com/api-webhook-limits and https://engineering.toggl.com/docs/track/. The account health check calls `GET /api/v9/me`, which spends from the same per-user hourly quota, so on a Free account run it sparingly. Tools do not retry.

**Known gaps:** 4 Reports operations are left out because they authenticate with a shared-report API key (`APIKeyAuth`), not the account's token: `POST /reports/api/v3/shared/{report_token}/csv`, `/pdf`, `/xlsx` and the `summary/time_entries.{extension}` variant listed with that scheme. The shared-report JSON read (`/shared/{report_token}`) is included. Toggl notes that some of its documents still fail OpenAPI validators; the compiler imported all other operations without skips. Some endpoints (groups, project members, audit logs, admin dashboard) need a paid plan or workspace admin rights. Binary exports (PDF, CSV) are returned as the API sends them. Not exercised against a live account.
