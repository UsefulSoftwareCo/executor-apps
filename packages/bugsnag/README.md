# Bugsnag

Bugsnag error monitoring through the Data Access API: organizations, projects,
collaborators and teams, error groups (list, triage, bulk update, delete), events,
comments, pivots, saved searches, releases and release groups, trends, stability,
feature flags, integrations, SCIM, data requests and deletions, and performance
span groups.

Interface: OpenAPI. SmartBear publishes the Data Access API definition (OpenAPI
3.0.3, "BugSnag - Data Access API" v2) on SwaggerHub under the `smartbear-public`
account, at https://api.swaggerhub.com/apis/smartbear-public/bugsnag-data-access-api/2
(linked from https://developer.smartbear.com/bugsnag/docs/data-access, which
docs.bugsnag.com/api/data-access/ redirects to). It generates 141 tools, 63 of them
mutations behind approvals. The definition lists two real servers, `api.bugsnag.com`
and `api.bugsnag.smartbear.com`; this package targets `api.bugsnag.com` only, so
organizations hosted on app.bugsnag.smartbear.com are not supported. The definition
omits the required `X-Version: 2` header, so the package adds it to every operation
as a parameter and defaults it to `2`. It also has no `GET /user`, so the health
check calls `GET /user/organizations`. The remote MCP server at
`https://bugsnag.mcp.smartbear.com/mcp` is official but OAuth-only (SmartBear login,
dynamic client registration); its tool count was not checked, and the OpenAPI tools
cover the API directly.

Auth: a personal auth token, sent as `Authorization: token <token>`. Create one in
Bugsnag under Settings > My account > Personal auth tokens. It has the same access
as the user. No OAuth: Bugsnag does not offer user-created OAuth apps for the Data
Access API.

Known gaps: the Build, Error Reporting, Session Tracking, Trace and Upload APIs
(project API keys, separate hosts) are not exposed. Pagination follows the
response's `Link` header, which generated tools do not surface; use each list tool's
offset/`per_page` parameters. Several tools are destructive (project, organization,
error and event deletion, data deletions, API key revocation); all mutations require
approval.
