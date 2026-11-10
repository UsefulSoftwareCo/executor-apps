# Bliro

Bliro is an AI sales assistant for field sales that records and summarizes calls. This package lists the calls of your organization (metadata, summaries and templates), with filters for keyword, time range, delivery status, contact and record name, and pagination.

Interface: OpenAPI. Bliro publishes its official swagger document only inside the docs page script ([api.bliro.io/docs](https://api.bliro.io/docs/), `swagger-ui-init.js`), not as a standalone file, so `spec.ts` embeds the single operation Bliro documents for API access, `GET /v3/calls`, from [Api Access](https://help.bliro.io/en/articles/10329784-api-access). That is 1 tool. The rest of the swagger document (templates, user settings, call editing) uses user logins, not client applications.

Auth: OAuth 2.0 client credentials. An organization admin creates a client application at [app.bliro.io/orgs/settings/clients](https://app.bliro.io/orgs/settings/clients) (API Access; Bliro lists API access under its "For Revenue Teams" plan) and receives a Client ID and Client Secret (shown once). The package exchanges them at `https://accounts.bliro.io/oauth/token` with `audience: https://api.bliro.io` (a JSON request, which Executor's `oauth2` helper cannot send), so the credentials are entered as secrets. There is no browser redirect and no redirect URI. The only scope, `org:calls:read`, is assigned automatically.

Known gaps: only the calls listing is available; call detail, transcripts and webhooks are not documented for client applications.
