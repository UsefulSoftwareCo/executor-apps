# Baserow

Rows, field list/create, table list, file uploads and the rest of the Baserow REST API on the hosted service at `api.baserow.io`.

Interface: OpenAPI, from Baserow's official schema at https://api.baserow.io/api/schema.json (106 operations are exposed). The schema marks 318 further operations as JWT-only and they are skipped (`auth_method`). Only 17 of the 106 accept a database token: rows CRUD and batch, field list/create for a table, `all-tables`, the token check, and user-file uploads. The other ~89 take no token at all (anonymous public-view, application-builder preview/dispatch, abuse reports, health checks) and cannot be filtered out with the current OpenAPI options, so they are listed but not useful with this credential.

## Auth

- Database token (`apiKey`): in Baserow open your settings, "Database tokens", create a token and grant it create/read/update/delete access to the tables you need. It is sent as `Authorization: Token <token>`.

## Known gaps

- Database tokens only authorize row operations on granted tables. Management endpoints (workspaces, applications, table and database management, views, and fields by id) require a short-lived JWT from email/password login, which cannot be stored as a long-lived credential, so those tools will be rejected.
- Self-hosted Baserow instances are not supported; only `api.baserow.io`.
