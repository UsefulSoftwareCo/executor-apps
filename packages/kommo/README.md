# Kommo

Kommo CRM: leads and complex lead creation, incoming leads, contacts, companies, customers, pipelines and stages, tasks, notes, tags, custom fields and field groups, catalogs (lists), users and roles, events, links between entities, sources, chat templates, webhooks, widgets, Salesbots and call logging.

## Interface

Hand-written tools (118) over the Kommo REST API v4, documented at https://developers.kommo.com/reference/kommo-api-reference. Kommo publishes no OpenAPI document (its `llms.txt` index links only Markdown pages), and no official remote MCP server, so each operation is declared from the reference pages. List filters and orders are passed as objects and sent as Kommo's bracketed query parameters (`filter[statuses][0][pipeline_id]=1`). Write tools take `body` exactly as the reference documents it (an array for batch endpoints). Every write requires approval.

## Auth

- **Long-lived token** (private integration). In Kommo open Settings > Integrations, create a private integration, and on its Keys and scopes tab generate a long-lived token. Connect with the account subdomain (the `<subdomain>` of `<subdomain>.kommo.com`) and the token.

OAuth 2.0 is not offered. Kommo's token endpoint is per account (`https://<subdomain>.kommo.com/oauth2/access_token`), but Executor declares OAuth token URLs statically, so a single connect page cannot serve every subdomain. The long-lived token carries the permissions of the user who created it.

## Known gaps

- Files API, Chats API (amojo) and Kommo AI API use different hosts and signing schemes and are not included.
- Accounts hosted on `amocrm.com` domains are not covered; only `*.kommo.com`.
- Kommo rate-limits to 7 requests per second per account.
- Icon is Kommo's official app icon (from the iOS App Store listing); Kommo publishes no standalone SVG of the mark.
