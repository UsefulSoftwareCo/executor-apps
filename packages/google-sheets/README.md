# Google Sheets

Create spreadsheets, read and write cell values (single ranges, batches, data filters, append, clear), copy sheets, search developer metadata, and run `batchUpdate` requests for formatting, structure, charts, pivot tables and more. 17 tools covering the whole Google Sheets API v4.

## Curated tools

The top-level tools are shaped for agents, after [gogcli](https://github.com/openclaw/gogcli)'s typed tool set: `read` (a range or the first tab, with the list of tabs), `append` and `write` (rows of values; `=` starts a formula). Reads span every linked account at once unless `account` names one; writes need `account` only when several accounts are linked, and ask for approval. Results name the account they came from by its address, read from OpenID userinfo and cached for a day. Their code is `tools/`, copied from `shared/google-tools` by `node scripts/google-vendor.ts`, which also gives the same tools to the all-in-one `google` package. The generated tools described below are under `api`, each taking an `accountId`.

## Interface

OpenAPI, from `https://api.apis.guru/v2/specs/googleapis.com/sheets/v4/openapi.json`. Google publishes Discovery documents, not OpenAPI; this is the APIs.guru conversion of Google's official Sheets v4 Discovery document (a maintained community conversion, not a Google-hosted file). The conversion requires both its `Oauth2` and `Oauth2c` schemes on every operation, so both are declared as bearer and filled from the OAuth access token. Three POST operations that only read (`developerMetadata.search`, `values.batchGetByDataFilter`, `getByDataFilter`) are marked as queries; all other mutations require approval.

Google also runs an official remote MCP server (`https://sheetsmcp.googleapis.com/mcp/v1`) but it is Developer Preview only (needs the Workspace Developer Preview Program) and exposes just six tools, so the REST API is used instead.

## Auth

OAuth 2.0 only (Google has no personal API keys for private spreadsheets). Discovery from `https://accounts.google.com`, scopes `openid email profile https://www.googleapis.com/auth/spreadsheets`, with `access_type=offline` and `prompt=consent` so a refresh token is issued. The framework takes the authorization and token endpoints from OpenID discovery, so `oauth2.googleapis.com` is not listed in the hosts. The `spreadsheets` scope is a sensitive scope: Google requires OAuth app verification before users outside your test users can grant it. Create the client in Google Cloud Console: enable the Google Sheets API, configure the OAuth consent screen, then create a "Web application" OAuth client and add Executor's OAuth callback URL shown on the connect page as an authorized redirect URI.

## Known gaps

- Reading and writing spreadsheet contents only; finding a spreadsheet by name or listing files needs Google Drive (a separate package).
- Uses the full `spreadsheets` scope. Narrower `drive.file` or `spreadsheets.readonly` scopes are not offered.
