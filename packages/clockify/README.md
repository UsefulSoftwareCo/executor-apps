# Clockify

Time tracking with Clockify: workspaces, projects, clients, tasks, tags, time entries, users, groups, expenses, invoices, approvals, webhooks and more. 164 tools, 114 of them mutations (each requires approval).

## Interface

Clockify's official OpenAPI document, https://docs.clockify.me/openapi.json (the same document that backs the API reference at https://docs.clockify.me/).

## Auth

- **API key** (`apiKey`): sent as the `X-Api-Key` header. Generate it in your Clockify Profile Settings (the vendor docs give no more detailed menu path). Workspaces on a custom subdomain need a new key generated in Profile Settings that works specifically for that workspace.
- **OAuth**: not offered. Clockify documents only API keys and add-on tokens; there is no user-created OAuth app flow.

Credentials go only to `api.clockify.me`.

## Known gaps

- 11 operations are skipped because they live on other hosts: 10 operations on `reports.api.clockify.me` (reports and shared reports) and 1 on `auditlog-api.api.clockify.me` (audit log). All are skipped with code `multiple_hosts` because their origin differs from the allowed one.
- Regional workspaces are unverified. Clockify's docs say the global host works for workspaces with or without a subdomain, but also say that a workspace in a specific region needs its URL prefix changed (`euc1` Germany, `use2` USA, `euw2` UK, `apse2` AU). Only `api.clockify.me` is allowed here, so regional workspaces may not work.
- No official Clockify MCP server was found in the vendor docs; a web search to confirm was not possible (search budget exhausted).
- Add-on token auth (`X-Addon-Token`) is not supported; it is for Clockify marketplace add-ons.
