# Mailgun

Send and manage email with Mailgun: messages, domains, DKIM and tracking settings, routes, webhooks, templates, mailing lists, suppressions (bounces, complaints, unsubscribes, allowlists), events, logs, stats and metrics, IPs and IP pools, API keys, subaccounts, single and bulk email validation, email previews and accessibility checks (Inspect), and deliverability monitoring (Optimize: blocklists, spam traps, inbox placement, DMARC). 421 tools (234 mutations, each requiring approval).

## Interface

OpenAPI, from Mailgun's four official OpenAPI 3.1 documents (the "Download OpenAPI description" links in the Mailgun docs), each mounted under its own key in one router:

- `send` (267 tools): https://documentation.mailgun.com/_bundle/docs/mailgun/api-reference/send/mailgun.json?download
- `validate` (26 tools): https://documentation.mailgun.com/_bundle/docs/validate/oas/openapi-validate-final.json?download
- `inspect` (59 tools): https://documentation.mailgun.com/_bundle/docs/inspect/api-reference/openapi-final.json?download
- `optimize` (69 tools): https://documentation.mailgun.com/_bundle/docs/inboxready/api-reference/optimize/inboxready.json?download

All four use the same hosts (api.mailgun.net, api.eu.mailgun.net) and HTTP Basic auth.

## Auth

- API key: a Mailgun private API key (HTTP Basic, username `api`). Create one in the Mailgun dashboard under Settings, API security. Choose the region, `us` (api.mailgun.net) or `eu` (api.eu.mailgun.net), matching where your domains live.

Mailgun has no user-created OAuth apps, so there is no OAuth method.

## Known gaps

- The specs do not declare a global security scheme; the package applies HTTP Basic to every operation.
- Mailgun's MCP server is local stdio only, so it is not used.
- `scripts/check.sh` and `scripts/tools.ts` only count the `send` spec (the exported `options`); the other three are counted separately.
