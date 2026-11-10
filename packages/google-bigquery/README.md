# Google BigQuery

Run SQL queries (`jobs.query`, `jobs.insert`, results via `jobs.getQueryResults`), manage datasets, tables, table data (including streaming `insertAll`), models, routines, row access policies and jobs, and read or set table, routine and row access policy IAM policies. 47 tools covering every method of the BigQuery REST API v2.

## Interface

OpenAPI, generated from Google's official BigQuery v2 Discovery document (`https://bigquery.googleapis.com/$discovery/rest?version=v2`, revision 20260922). Google publishes Discovery documents, not OpenAPI, so `convert-discovery.mjs` converts that document to `openapi.json` (Discovery-to-OpenAPI 3.0 conversion, run as `node convert-discovery.mjs disc.json openapi.json`). All 47 methods are included; the shared `{+resource}` IAM paths are expanded to their concrete table, routine and row access policy paths. Table, routine and row access policy `getIamPolicy` and `testIamPermissions` are POST operations that only read, so they are marked as queries; all other mutations require approval (including `jobs.query`, since SQL can contain DML/DDL). Resumable media upload for `jobs.insert` load jobs is not modelled; only the JSON form is.

Google also runs an official remote MCP server (`https://bigquery.googleapis.com/mcp`, OAuth via `accounts.google.com`, scope `bigquery`), but it exposes only a handful of tools, so the REST API is used instead.

## Auth

OAuth 2.0 only. Discovery from `https://accounts.google.com`, scopes `openid email profile https://www.googleapis.com/auth/bigquery`, with `access_type=offline` and `prompt=consent` so a refresh token is issued. Service account keys are not offered, since Executor has no JWT-bearer method. The framework takes the OAuth endpoints from OpenID discovery, so `oauth2.googleapis.com` is not listed in the hosts. Choose Executor for Google on Executor Cloud when offered. For a custom client, use Google Cloud Console: enable the BigQuery API on a project, configure the OAuth consent screen, then create a "Web application" OAuth client and add Executor's OAuth callback URL shown on the connect page as an authorized redirect URI. Queries are billed to the project id you pass in each call.

## Known gaps

- No service account auth.
- Uses the full `bigquery` scope; narrower `bigquery.readonly` or `bigquery.insertdata` scopes are not offered.
- Resumable/multipart media upload on `jobs.insert` is not exposed.
- The related Connection, Data Transfer, Reservation, Analytics Hub and Data Policy APIs are separate Google APIs (other hosts) and are not included.

Executor Cloud can offer its shared **Executor for Google** OAuth client when the operator has configured it and enabled these scopes. Custom OAuth clients remain available; use the callback URL shown on the connect page. Self-hosted operators configure their own client. Google project API enablement, quotas, billing and account permissions still apply.
