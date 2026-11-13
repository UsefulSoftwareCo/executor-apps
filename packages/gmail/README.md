# Gmail

Messages, threads, drafts, labels, history, filters, forwarding addresses, send-as aliases, delegates and settings for a Gmail account, as 85 tools generated from the Gmail API. Every mutation asks for approval.

## Curated tools

The top-level tools are shaped for agents, after [gogcli](https://github.com/openclaw/gogcli)'s typed tool set: `search` (Gmail search syntax, returning thread summaries with sender, subject, date and snippet), `readThread`, `readMessage` and `attachment` (decoded text instead of MIME), `labels` (with unread counts), `send` and `draft` (plain fields; replies keep the thread, subject and references, with reply-all), and `modify` (archive, read, star, trash and labels by name). Reads span every linked account at once unless `account` names one; writes need `account` only when several accounts are linked, and ask for approval. Results name the account they came from by its address, read from the Gmail profile and cached for a day. Their code is `tools/`, copied from `shared/google-tools` by `node scripts/google-vendor.ts`, which also gives the same tools to the all-in-one `google` package. The generated tools described below are under `api`, each taking an `accountId`.

## Interface

OpenAPI, vendored as `gmail-openapi.json`. Google publishes the Gmail API only as a Discovery document, so `discovery-to-openapi.mjs` (the converter `google-drive` uses, with Gmail's settings) converts Google's own document (`https://gmail.googleapis.com/$discovery/rest?version=v1`, **revision 20261106**) into OpenAPI 3. The output is checked in so any upstream change shows up in review. To refresh: `curl -s 'https://gmail.googleapis.com/$discovery/rest?version=v1' -o /tmp/g.json && node packages/gmail/discovery-to-openapi.mjs /tmp/g.json > packages/gmail/gmail-openapi.json`, update the revision here and in `openapi.ts`, then run `node scripts/google-vendor.ts`. Every operation is tagged with its Discovery resource, so the tools stay under `users` as before, and carries a plain bearer requirement.

APIs.guru's conversion, used before, is no longer used: it turned the six methods that take a whole message (`drafts.create`, `drafts.update`, `drafts.send`, `messages.send`, `messages.insert`, `messages.import`) into `message/*` uploads sent to the JSON path, so none of them could succeed. Here those methods take JSON with a base64url `raw` message, and each also has a `<method>Media` operation: a simple upload (`uploadType=media`) of the base64-encoded RFC 822 message to its `/upload/gmail/v1/...` path, for large messages.

Google also runs an official Gmail MCP server (`https://gmailmcp.googleapis.com/mcp/v1`). It is a gated Developer Preview: it requires Workspace Developer Preview Program membership and enabling `gmailmcp.googleapis.com`, exposes only about ten tools (search threads, get thread/message, drafts, labels), cannot send email, and allows only `gmail.readonly` and `gmail.compose`. Because of that, the REST API was chosen deliberately over the MCP server. Revisit once the MCP reaches general availability.

## Auth

OAuth 2.0 only; Gmail does not accept API keys for mailbox data. Create an OAuth client in the Google Cloud console (Google Auth Platform > Clients, type "Web application"), enable the Gmail API for the project, and add the Executor redirect URI (shown on the connect page, `/api/oauth/callback` on the Executor origin) as an authorized redirect URI. Add the test users on the consent screen while the app is in testing. The connect page asks for the client ID and secret.

Scopes requested: `https://mail.google.com/` (full Gmail access, the scope Executor for Google is verified for; `gmail.modify` is not on its consent screen and makes Google show the unverified-app warning) and `gmail.settings.basic` (filters, signatures, vacation responder, send-as). Both are RESTRICTED scopes in Google's classification. Production use outside the project's test users needs restricted-scope OAuth verification plus an annual third-party security assessment. `gmail.settings.basic` is kept because the filter, signature, vacation and send-as tools are worth it; drop it from `index.ts` to reduce the verification burden to `https://mail.google.com/` alone (those settings tools then fail). Sign-in uses `access_type=offline` and `prompt=consent` so Google returns a refresh token.

## Known gaps

10 of the 85 tools are exposed but cannot succeed with the granted scopes:

- 3 need the restricted `https://mail.google.com/` scope (permanent delete): `messages.delete`, `messages.batchDelete`, `threads.delete`. Trash instead.
- 7 are administrative `gmail.settings.sharing` or service-account-only operations that need domain-wide delegation: `delegates.list/get/create/delete` (4), `forwardingAddresses.create/delete` (2), `settings.updateAutoForwarding` (1).
- The `settings.cse.*` tools only work on Workspace accounts with client-side encryption.
- Uploads (the `<method>Media` tools) are simple uploads only; the message travels inside the tool call, and metadata such as `threadId` or `labelIds` needs the JSON operation. Multipart and resumable uploads are not exposed.
