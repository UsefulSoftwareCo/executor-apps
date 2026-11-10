# Twenty

Twenty CRM on the cloud API (`https://api.twenty.com`): people, companies, opportunities, notes, tasks, note and task targets, attachments, workflows, workspace members, any custom object through generic `records.*` tools (including batch create), and object and field metadata management (`metadata.objects.*`, `metadata.fields.*`). About 60 tools.

**Interface: hand-written tools over Twenty's REST API.** Twenty has no static OpenAPI document: its docs state each workspace generates its own schema, and `/rest/open-api/core` requires a workspace credential, which the OpenAPI source cannot send. The standard objects get typed list/get/create/update/delete tools; custom objects are reached by plural name through `records.*`. Source: https://docs.twenty.com/developers/extend/api

## Auth

- **API key.** In Twenty, Settings > APIs & Webhooks > Create key (shown once). Sent as `Authorization: Bearer`. Restrict access by assigning the key a role.
- **OAuth.** Twenty publishes RFC 8414 metadata (`https://api.twenty.com/.well-known/oauth-authorization-server`) with scope `api` and a `registration_endpoint`, so Executor registers its own OAuth client (RFC 7591) when you connect; nothing to set up by hand. Only if the connect page asks for a client ID and secret, create a client yourself (Twenty has no developer dashboard; register one through the registration endpoint with `token_endpoint_auth_method: client_secret_post`, `grant_types: authorization_code, refresh_token`) and enter them. The connect page shows Executor's redirect URI; it must be added to `redirect_uris` of any manually created client. See https://docs.twenty.com/developers/extend/oauth

## Known gaps

- Cloud only: credentials are limited to `api.twenty.com`. Self-hosted instances (`https://<your-domain>/rest`) are not supported because the host cannot be declared per account.
- No GraphQL tools, webhooks management or merge/duplicate endpoints.
- Limits: 100 requests per minute, 60 records per batch.

## Source verification

- Confirmed in the vendor docs (https://docs.twenty.com/developers/extend/api): the `/rest/` and `/rest/metadata/` base paths, `fields` and `depth` parameters, the 60-record batch limit and the 100/min rate limit.
- Confirmed in the open-source server code (https://github.com/twentyhq/twenty, `twenty-server`): `POST /rest/batch/{object}`, `/rest/metadata/objects` and `/rest/metadata/fields` (GET list, GET/PATCH/DELETE by id, POST), the `filter` syntax `field[comparator]:value` with comparators eq, neq, in, containsAny, is, gt, gte, lt, lte, startsWith, endsWith, like, ilike, the `order_by` syntax `field[AscNullsFirst],...`, and the `{ data: { <plural>: [...] } }` list response shape used by the health check.
- Not independently confirmed: the per-workspace API reference (Settings > API & Webhooks) needs a credential, so individual field names of each standard object were not checked against a live workspace. `workspaceMembers` as a REST object is inferred from the server's `workspace-member` standard object; it was not called.
