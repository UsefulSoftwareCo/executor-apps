# Mailchimp

Audiences (lists), members, segments, tags, campaigns, templates, automations, reports, landing pages, ecommerce stores, file manager and the rest of the Mailchimp Marketing API: 298 tools, 149 of them mutations (each mutation asks for approval).

Interface: OpenAPI. Source is Mailchimp's official Swagger 2.0 description in the `mailchimp/mailchimp-client-lib-codegen` repository, `https://raw.githubusercontent.com/mailchimp/mailchimp-client-lib-codegen/main/spec/marketing.json`. Its host is a placeholder; each account is pointed at its own data center, `https://<dc>.api.mailchimp.com/3.0`. The separate Transactional (Mandrill) API and the Intuit Mailchimp MCP server (`https://ai-inc.mailchimp.com/claude/mcp/v2`, OAuth with dynamic registration, not wired up) are not included.

## Auth

- API key: create one under Account > Extras > API keys. Enter the key and the server prefix, which is the part after the dash in the key (`abc123-us6` means `us6`). Sent as HTTP Basic auth (any username, the key as password).
- OAuth: register an app under Account > Extras > Registered apps and enter its client id and secret in Executor. Set the redirect URI to the one Executor's connect page shows. Mailchimp's OAuth guide does not state a token lifetime (community reports say tokens do not expire, which is unverified against vendor docs), and the grant carries no scopes; the data center is looked up from `https://login.mailchimp.com/oauth2/metadata`. Sent as a Bearer token.

## Gaps

- The OAuth bearer path and API key Basic path could not be exercised against Mailchimp without real credentials; they were only typechecked, compiled and deployed.
- The health check reads `GET /` and uses `account_id` and `account_name` for the account label only when present, because the spec declares no required properties on that response; it was not run against a live key.
- OAuth accounts look the data center up from `login.mailchimp.com/oauth2/metadata` on each health check and tool build. Mailchimp's token response carries no `dc` and the app framework offers no connect-time hook to store one, so this cannot be resolved once at connection time.
- API key accounts need the server prefix typed in, because the key itself is a secret the app cannot read.
