# Google Drive

Files, folders, shared drives, permissions, comments, replies, revisions, changes, labels,
access proposals and approvals in Google Drive: 64 tools (36 mutations, each requiring approval).

## Curated tools

The top-level tools are shaped for agents, after [gogcli](https://github.com/openclaw/gogcli)'s typed tool set: `search` (plain words or Drive query syntax, newest first) and `read` (any file as text: Docs as Markdown, Sheets as CSV, Slides as text). Reads span every linked account at once unless `account` names one; writes need `account` only when several accounts are linked, and ask for approval. Results name the account they came from by its address, read from Drive's `about` resource and cached for a day. Their code is `tools/`, copied from `shared/google-tools` by `node scripts/google-vendor.ts`, which also gives the same tools to the all-in-one `google` package. The generated tools described below are under `api`, each taking an `accountId`.

## Interface

OpenAPI, vendored as `drive-openapi.json`. Google publishes Drive v3 only as a Discovery
document, so `discovery-to-openapi.mjs` converts Google's own document
(`https://www.googleapis.com/discovery/v1/apis/drive/v3/rest`, **revision 20261005**) into
OpenAPI 3. The conversion is ours, not Google's, and the output is checked in so any upstream
change shows up in review. To refresh:
`curl -s https://www.googleapis.com/discovery/v1/apis/drive/v3/rest -o /tmp/d.json && node packages/google-drive/discovery-to-openapi.mjs /tmp/d.json > packages/google-drive/drive-openapi.json`,
then update the revision above. (APIs.guru's copy was not used: it lagged Google's by 16
methods, including approvals, access proposals, `files.download`, `files.generateCseToken`.)
Every operation is declared with a plain bearer requirement.

Google also runs an official remote MCP server (`https://drivemcp.googleapis.com/mcp/v1`),
but it has 8 tools and is limited to the Google Workspace Developer Preview Program, so
the REST API is used instead.

## Auth

OAuth 2.0 only (Google has no user API keys for private Drive data). Create an OAuth client
of type "Web application" in Google Cloud Console (APIs & Services > Credentials), enable the
Google Drive API for the project, and configure the consent screen (add test users while it is
External and unverified). Add Executor's OAuth redirect URI shown on the connect page to the
client's authorized redirect URIs. The app requests the
`https://www.googleapis.com/auth/drive` scope with `access_type=offline` and `prompt=consent`
so a refresh token is issued. Discovery is from `https://accounts.google.com`.

`auth/drive` is a restricted scope. Production use by users outside your own organization
needs Google's restricted-scope OAuth verification (and possibly an annual third-party
security assessment). The test stage with test users does not. The narrower `drive.file` scope
would avoid this, but limits the tools to files the user opens with or shares to the app (and
files the app creates), so listing and searching the whole Drive would not work.

## Known gaps

- File content upload (`upload/drive/v3`, media and multipart) is not in the Discovery
  REST surface used here; `files.create` and `files.update` handle metadata only.
- `files.export` and `files.get?alt=media` return binary data as base64 (`alt` is not exposed;
  use `files.download`, a long-running operation, for content).
- Watch/push-notification channels are present but need a public webhook receiver.
