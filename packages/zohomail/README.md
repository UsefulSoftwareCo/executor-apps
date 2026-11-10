# Zoho Mail

Send, read, search and organize Zoho Mail email (35 tools): mailboxes, messages (list, search, metadata, headers, HTML body, attachment info, send, draft, reply, mark read/unread, archive, spam, flag, move, label, delete), folders, labels, notes and tasks.

## Interface

Hand-written tools over the Zoho Mail REST API (<https://www.zoho.com/mail/help/api/>). Zoho publishes no OpenAPI document, GraphQL API or Mail-specific MCP server, so each tool maps to one documented endpoint under `https://mail.zoho.<tld>/api`. `accountId` is optional on every mailbox tool and defaults to the user's first mailbox. Zoho returns most fields as strings, and ids are kept as strings.

## Auth

OAuth 2.0 only; there is one method per Zoho data center (US, EU, India, Australia, Japan, Canada, Saudi Arabia, UAE, China). Pick the one matching the domain of your Zoho Mail web app (`mail.zoho.eu` is EU). A pasted access token lasts one hour, so no API-key method is offered.

Create the client in the Zoho API Console for your data center (<https://api-console.zoho.com>, or the `.eu`, `.in`, ... equivalent): a Server-based Application, with Executor's redirect URI shown on the connect page as the authorized redirect URI. Paste its client ID and secret into the connect page. Scopes (comma separated) are `ZohoMail.accounts.READ`, `ZohoMail.messages.ALL`, `ZohoMail.folders.ALL`, `ZohoMail.tags.ALL`, `ZohoMail.notes.ALL` and `ZohoMail.tasks.ALL`, with `access_type=offline` and `prompt=consent` so Zoho returns a refresh token. Tokens go in the `Authorization: Zoho-oauthtoken <token>` header.

## Known gaps

- Organization admin APIs (users, domains, groups, mail policy, logs) are not exposed; they need admin scopes.
- Sending attachments, downloading attachment content and updating notes, tasks or labels are not covered.
- Bookmarks, signatures and threads-only operations are not covered (thread ids work in the message update tools).
- Mutations ask for approval on every call.
