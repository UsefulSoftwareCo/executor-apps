# Brevo

Covers Brevo's REST API (v3): contacts and lists, email/SMS/WhatsApp campaigns, transactional email and SMS, senders and domains, templates, webhooks, CRM (companies, deals, tasks), conversations, ecommerce, events and loyalty.

Interface: OpenAPI, from Brevo's official document at https://api.brevo.com/v3/swagger_definition_v3.yml (291 tools, none skipped). Brevo's MCP server (https://mcp.brevo.com/v1/brevo/mcp) has far fewer tools, so it is not used.

## Auth

- API key: create one in Brevo under SMTP & API > API keys (https://app.brevo.com/settings/keys/api). Sent as the `api-key` header.
- OAuth 2.0: create an OAuth app with the Brevo CLI (`brevo app create`, https://developers.brevo.com/docs/apps-getting-started) and enter its client ID and secret on the connect page. Register Executor's redirect URI on the app (`auth.redirect_uris`). Endpoints come from https://oauth.brevo.com/realms/partner (OIDC discovery). Brevo currently allows only private apps, usable by users in your own Brevo organization. `:write` scopes do not imply `:read`, so both are requested.

Mutations require approval.

## Known gaps

- Partner-key authentication (the `partner-key` header) is not supported.
- The OAuth scope list excludes admin areas (`organization`, `account:write`, `brevo_functions`); endpoints in those areas return 403 under OAuth.
- Brevo's document does not declare bearer auth; the package widens the root security to accept it.
