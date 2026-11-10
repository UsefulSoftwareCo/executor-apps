# Workato

Workato's Developer API: recipes (create, edit, start, stop, versions, force run), jobs, connections and connector metadata, projects, builds and deployments, recipe lifecycle packages, lookup tables, data tables, environment and project properties, tags, API platform collections, endpoints and clients, on-prem groups and agents, and event streams, plus a `request` escape hatch for any other endpoint.

## Interface

Hand-written tools over the official REST API (`https://<data center host>/api`, docs at https://docs.workato.com/en/workato-api.html). Workato publishes no OpenAPI document for the Developer API (its docs are Markdown pages only) and no connectable remote MCP endpoint, so the documented endpoints are wrapped directly, about 140 tools. List tools take a `query` record; create and update tools take the JSON body from the API reference. Every create, update, delete and action tool requires approval.

## Auth

API client token. In Workato open Workspace admin > API clients, create a client with a client role and project scopes that allow the endpoints you need, and copy its token. Enter:

- **Data center host**: one of `www.workato.com` (US), `app.eu.workato.com`, `app.jp.workato.com`, `app.sg.workato.com`, `app.au.workato.com`, `app.il.workato.com`, `app.kr.workato.com`, `app.uk.workato.com`, `app.workatoapp.cn`, or `app.trial.workato.com` (free, Pro and Developer Sandbox).
- **API client token**: sent as `Authorization: Bearer <token>`.

Workato documents no OAuth flow for the Developer API, so none is declared. Legacy `x-user-token` API keys were removed by Workato in October 2025 and are not supported. The health check calls `GET /api/users/me`, so the client role must allow it.

## Known gaps

- Virtual Private Workato hosts are not supported (hosts are an allowlist of the public data centers).
- Agent Studio, MCP servers management, Workato Identity IAM, custom connectors, custom OAuth profiles, XChange, cross-workspace sharing, test automation, roles and collaborator groups are not wrapped; use `request` for them.
- File upload and download link endpoints for data tables are not wrapped.
- Vendor icon: the official Workato mark from workato.com.
