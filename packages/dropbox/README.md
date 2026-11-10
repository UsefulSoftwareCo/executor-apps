# Dropbox

Files, folders, search, revisions, sharing (shared links, shared folders and members), file requests and account info across the Dropbox API v2.

**Interface:** hand-written tools over the documented Dropbox API v2 (https://www.dropbox.com/developers/documentation/http/documentation, hosts `api.dropboxapi.com` and `content.dropboxapi.com`). Dropbox publishes no OpenAPI document; its official API spec is in its own Stone format (https://github.com/dropbox/dropbox-api-spec). Dropbox's hosted MCP server (`https://mcp.dropbox.com/chatgpt_app_mcp`, OAuth) is aimed at ChatGPT; its tool list could not be inspected without a token, so it is not used. 40 tools.

## Auth

- **Access token** (`token`): in the Dropbox App Console (https://www.dropbox.com/developers/apps) open your app, Permissions tab to enable scopes, then Settings tab, "Generated access token". These tokens are short-lived, so they suit testing.
- **OAuth 2.0** (`oauth`): create an app in the App Console, enable the scopes (account_info.read, files.metadata.read/write, files.content.read/write, sharing.read/write, file_requests.read/write) on the Permissions tab, add the Executor redirect URI shown on the connect page under Redirect URIs, then enter the app key and secret as the client ID and secret. `token_access_type=offline` is requested so Dropbox issues a refresh token.

## Known gaps

- Uploads are text only (`files.uploadText`), and `files.readText` returns text; use `files.temporaryLink` to fetch binaries. Chunked upload sessions, thumbnails and previews are not exposed.
- Dropbox Business (team) endpoints, Paper and batch operations are not exposed.

Notes: scopes are set in the App Console Permissions tab and apply to the app; the `scope` request parameter sent by Executor is not required by Dropbox. The token request sends client credentials in the request body (`client_secret_post`); Dropbox's OAuth guide does not document the accepted client-authentication methods, and this is not confirmed against a live token exchange.
