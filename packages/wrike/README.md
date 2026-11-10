# Wrike

Tasks, folders, projects, spaces, comments, attachments, timelogs, custom fields, workflows, users and groups, and the rest of the Wrike REST API v4: 202 tools, all operations in the spec. Mutations ask for approval.

**Interface:** OpenAPI, Wrike's official document at https://developers.wrike.com/openapi/wrike_api_v4_ver154.yaml (index: https://developers.wrike.com/openapi/). Wrike also has a remote MCP server (https://mcp.wrike.com/app/mcp/stream) with fewer tools, so the OpenAPI document is used.

**Icon:** the green check mark cropped from Wrike's developer-docs logo SVG, https://files.readme.io/b70df1713168dcf47e8f7ec71aa4cbe551330a1b94df5bca8c76fc3382146a54-9eecaaeb5650b3a9333b310292e3e3cbbb83ad0adcf372b23641ba9aaa07af47-svgviewer-output.svg (Simple Icons has no Wrike entry).

## Data centers

Wrike hosts each account in one data center, and every call must go to `https://<host>/api/v4`; the wrong host answers 401.

- **Permanent token accounts** enter a `host` next to the token: the host shown in the browser address bar when you open Wrike (`www.wrike.com`, `app-eu.wrike.com`, `app-us2.wrike.com`, ...). Tools and the health check use that host. Only `*.wrike.com` hosts are accepted.
- **OAuth accounts are fixed to `www.wrike.com`.** Wrike's token response names the account's host, but Executor keeps only the access token of an OAuth grant, so the host cannot be read back. An EU or US2 account that signs in with OAuth fails the health check with a message pointing at the permanent token. Use a permanent token for those accounts.

## Auth

- **Permanent access token** (`token`): in Wrike, open Apps & Integrations, then API, create an app and generate a permanent token. Enter the token and your Wrike host. Sent as a bearer token.
- **OAuth 2.0** (`oauth`, `www.wrike.com` accounts only): create an API app at https://www.wrike.com/frontend/apps/index.html#/api, add Executor's redirect URI shown on the connect page, and enter the client ID and secret. Authorization at `login.wrike.com/oauth2/authorize/v4`, client credentials sent in the token request body, scopes comma separated. Access tokens last one hour; Executor refreshes them (Wrike's refresh docs are inconsistent about login.wrike.com versus the host, not verified live).

### Scopes

Each Wrike method needs at least one of the scopes listed in its description in the spec. Requested: `Default`, `wsReadWrite` (the 138 workspace tools) plus the scopes below for the account-management tools. The scope names were taken from the live spec.

| Scope | Tools | Admin implication |
| --- | --- | --- |
| `amReadWriteUser` | user and contact tools that read or change users | account administrator only; lets the app change users |
| `amReadWriteGroup` | group tools that read or change groups | administrator only |
| `amReadWriteInvitation` | invitations: list, create, resend, delete | administrator only; can invite people into the account |
| `amReadWriteWorkflow` | workflow tools that read or change workflows | administrator only |
| `amReadWriteWorkSchedule` | work schedules, exclusions and capacity overrides (also covers the read-only ones) | administrator only |
| `amReadOnlyAccessRole` | list access roles | administrator only |
| `amReadOnlyAuditLog` | read the audit log | administrator only |

A non-administrator can still sign in; those tools return 401/403 for them. Whether Wrike rejects a consent request that names admin scopes for a non-admin was not tested.

## Known gaps

- `dataExportFull` (the 4 account data export tools) is not requested: it grants a full export of the account. Those tools fail under OAuth. They work with a permanent token only if the token carries that scope.
- OAuth for accounts outside `www.wrike.com` (see Data centers).
- The Wrike document's array query parameters may need a bracketed form (`accessTypes=[Public]`) in practice.
- The Datahub and Cloud Content Connector specs are not included.
- The health check reads `GET /contacts?me=true` and decodes only `id`, because the spec marks no Contact field as required; it was not run against a live account.
