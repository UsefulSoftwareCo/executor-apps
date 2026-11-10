# MailerSend

Send and manage transactional email and SMS with MailerSend: messages and bulk sends, domains, templates, webhooks, suppressions, inbound routes, recipients, analytics and tokens.

Interface: OpenAPI 3.1, MailerSend's official document published on SwaggerHub
(https://app.swaggerhub.com/apis/MailerSend/mailersend-api/1.0.0-oas3.1, fetched from
`https://api.swaggerhub.com/apis/MailerSend/mailersend-api/1.0.0-oas3.1`). Requests go to `https://api.mailersend.com/v1`.

Auth: API token. Create one in MailerSend under Integrations > API tokens and grant the scopes you need
(the health check reads domains, so enable domain read access). OAuth is not offered because MailerSend's
REST API only accepts API tokens (its hosted MCP server at https://mcp.mailersend.com/mcp uses OAuth but is not mounted here).

Known gaps: the SwaggerHub document covers 97 operations; anything MailerSend adds to the REST API but not to that document is missing.
