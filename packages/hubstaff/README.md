# Hubstaff

Time tracking, projects, tasks, members, teams, timesheets, attendance, payments and activity reports from Hubstaff.

Interface: OpenAPI, from Hubstaff's official API v2 document (Swagger 2.0), served by the API at https://api.hubstaff.com/v2/docs. Every mutation requires approval.

Auth: OAuth 2.0 only (Hubstaff has no static API keys; personal access tokens are refresh tokens that must be exchanged, which is not supported here). Create an app at https://developer.hubstaff.com/ and enter its client ID and secret on the connect page. Register the redirect URI Executor shows on the connect page with the app. Endpoints come from Hubstaff's OIDC metadata at https://account.hubstaff.com/.well-known/openid-configuration; scopes are `hubstaff:read` and `hubstaff:write`.

Known gaps: the `tasks:read` / `tasks:write` scopes of the separate Tasks API are not requested.

OAuth nonce: Hubstaff's swagger marks the oauth2 scheme `x-nonce: true`. Executor's `oauth2()` reserves `nonce` as a host-owned authorization parameter, so the package cannot set it. Hubstaff's nonce is an OIDC id_token replay guard that only matters with the `openid` scope, which this package does not request; if the authorize request is rejected without it, that is a framework limitation.
