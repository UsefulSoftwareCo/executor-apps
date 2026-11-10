# Google Data Studio

Google Data Studio (now Looker Studio): search reports and data sources and manage who can view or edit them. 5 tools: `searchAssets`, `getPermissions`, `updatePermissions`, `addMembers`, `revokeAllPermissions`. The API cannot read report contents (pages, filters, fields) or data.

## Interface

Hand-written tools over Google's official Data Studio API, `https://datastudio.googleapis.com/v1` (reference: https://developers.google.com/looker-studio/integrate/api/reference). Google does not publish a public Discovery document for it (the `$discovery` endpoint requires an API key), there is no OpenAPI document and no official MCP server, so the five documented methods are written by hand from the reference pages. `searchAssets` and `getPermissions` are reads; the other three mutate and require approval.

## Auth

OAuth 2.0 only, discovery from `https://accounts.google.com`, scopes `openid email profile https://www.googleapis.com/auth/datastudio` with `access_type=offline` and `prompt=consent`. Google has no dynamic client registration: in Google Cloud Console enable the Data Studio API, create an OAuth client ID of type "Web application" and add the redirect URI shown on Executor's connect page.

The API is only available to users in a Google Workspace or Cloud Identity organization, and a Workspace admin must authorize the OAuth client ID with the `datastudio` scope through domain-wide delegation in the Admin console (https://support.google.com/a/answer/162106). Without that, sign-in fails with `invalid_scope`.

## Known gaps

- Personal Google accounts cannot use the API.
- Only asset search and sharing; no report creation, editing or data access.
- The read-only scope `datastudio.readonly` is not offered separately.
