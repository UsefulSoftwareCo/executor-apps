# Gmail

Messages, threads, drafts, labels, history, filters, forwarding addresses, send-as aliases, delegates and settings for a Gmail account, as 79 tools generated from the Gmail API. Every mutation asks for approval.

## Curated tools

The top-level tools are shaped for agents, after [gogcli](https://github.com/openclaw/gogcli)'s typed tool set: `search` (Gmail search syntax, returning thread summaries with sender, subject, date and snippet), `readThread`, `readMessage` and `attachment` (decoded text instead of MIME), `labels` (with unread counts), `send` and `draft` (plain fields; replies keep the thread, subject and references, with reply-all), and `modify` (archive, read, star, trash and labels by name). Reads span every linked account at once unless `account` names one; writes need `account` only when several accounts are linked, and ask for approval. Results name the account they came from by its address, read from the Gmail profile and cached for a day. Their code is `tools/`, copied from `shared/google-tools` by `node scripts/google-vendor.ts`, which also gives the same tools to the all-in-one `google` package. The generated tools described below are under `api`, each taking an `accountId`.

## Interface

OpenAPI, from `https://api.apis.guru/v2/specs/googleapis.com/gmail/v1/openapi.json`. Google publishes the Gmail API only as a Discovery document, which is the authoritative source (`https://gmail.googleapis.com/$discovery/rest?version=v1`), not OpenAPI. The spec used here is APIs.guru's maintained, unofficial OpenAPI conversion of that document (79 operations, matching the Discovery document). The spec's implicit/authorization-code oauth2 schemes are replaced by bearer schemes of the same names so the OAuth access token is sent as `Authorization: Bearer`.

Google also runs an official Gmail MCP server (`https://gmailmcp.googleapis.com/mcp/v1`). It is a gated Developer Preview: it requires Workspace Developer Preview Program membership and enabling `gmailmcp.googleapis.com`, exposes only about ten tools (search threads, get thread/message, drafts, labels), cannot send email, and allows only `gmail.readonly` and `gmail.compose`. Because of that, the REST API was chosen deliberately over the MCP server. Revisit once the MCP reaches general availability.

## Auth

OAuth 2.0 only; Gmail does not accept API keys for mailbox data. Create an OAuth client in the Google Cloud console (Google Auth Platform > Clients, type "Web application"), enable the Gmail API for the project, and add the Executor redirect URI (shown on the connect page, `/api/oauth/callback` on the Executor origin) as an authorized redirect URI. Add the test users on the consent screen while the app is in testing. The connect page asks for the client ID and secret.

Scopes requested: `https://mail.google.com/` (full Gmail access, the scope Executor for Google is verified for; `gmail.modify` is not on its consent screen and makes Google show the unverified-app warning) and `gmail.settings.basic` (filters, signatures, vacation responder, send-as). Both are RESTRICTED scopes in Google's classification. Production use outside the project's test users needs restricted-scope OAuth verification plus an annual third-party security assessment. `gmail.settings.basic` is kept because the filter, signature, vacation and send-as tools are worth it; drop it from `index.ts` to reduce the verification burden to `https://mail.google.com/` alone (those settings tools then fail). Sign-in uses `access_type=offline` and `prompt=consent` so Google returns a refresh token.

## Known gaps

10 of the 79 tools are exposed but cannot succeed with the granted scopes:

- 3 need the restricted `https://mail.google.com/` scope (permanent delete): `messages.delete`, `messages.batchDelete`, `threads.delete`. Trash instead.
- 7 are administrative `gmail.settings.sharing` or service-account-only operations that need domain-wide delegation: `delegates.list/get/create/delete` (4), `forwardingAddresses.create/delete` (2), `settings.updateAutoForwarding` (1).
- The `settings.cse.*` tools only work on Workspace accounts with client-side encryption.
- Media upload endpoints (`/upload/gmail/v1/...`) are not part of the converted spec; send and insert use the `raw` base64url message field.
