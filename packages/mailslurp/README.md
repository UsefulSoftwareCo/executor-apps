# MailSlurp

Programmable email and SMS for developers and testing: create disposable or persistent inboxes, send and receive email, wait for messages, manage contacts, templates, webhooks, domains, phone numbers and attachments.

**Interface:** OpenAPI. MailSlurp's own OpenAPI 3 document, served by the API at <https://api.mailslurp.com/v2/api-docs>. Every mutation requires approval. The spec's MCP transport (`/mcp`), MCP OAuth and `.well-known` discovery endpoints are removed because they are not REST operations.

**Auth:** API key. Create one in the MailSlurp dashboard under Settings > Developers (<https://app.mailslurp.com/settings/developers/>). It is sent in the `x-api-key` header to `api.mailslurp.com`.

**Why OpenAPI and not MCP:** MailSlurp also runs an official remote MCP server at <https://api.mailslurp.com/mcp> (docs: <https://www.mailslurp.com/docs/mcp/>). It supports OAuth (dynamic client registration, PKCE, discovery) and scoped agent keys sent in `x-api-key`. The vendor says normal account API keys must not be used as MCP credentials, and the REST API has no user-created OAuth apps, so this package uses the full REST OpenAPI (hundreds of operations) with an account API key and does not mount the MCP server.

**Known gaps:** the spec is large (800+ operations).
