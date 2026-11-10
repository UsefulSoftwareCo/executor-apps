# Respond.io

Contacts (create, update, merge, list, tags, lifecycle, channels), messages
(send text, attachments, WhatsApp templates and email; read status), conversations
(assign, open and close), internal comments, and workspace users, custom fields,
channels, templates, closing notes and tags: 27 hand-written tools.

Interface: Respond.io's Developer API v2, `https://api.respond.io/v2`
(https://developers.respond.io). Respond.io publishes no OpenAPI document, and its
official MCP server (github.com/respond-io/mcp-server) is self-hosted rather than
remote, so the tools are written by hand from the documented endpoints and the
official TypeScript SDK's endpoint list (github.com/respond-io/typescript-sdk).
Contacts are addressed as `id:<id>`, `email:<address>` or `phone:<number>`.

Auth:

- API key (`apiKey`): a Developer API access token, sent as a bearer token. Create
  one in Respond.io under Settings > Integrations > Developer API (up to 10 per
  workspace).
- OAuth: not offered; Respond.io has no user-created OAuth apps for this API.

Known gaps: webhooks are configured in the Respond.io dashboard and are not
covered; request bodies are passed through as JSON without schemas. All
non-GET operations ask for approval, including contacts.list (POST /contact/list),
which is a read but is sent as a POST.
