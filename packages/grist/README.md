# Grist

Grist relational spreadsheets: organizations, workspaces, documents, tables, records, columns, attachments, snapshots, webhooks and access control, on hosted Grist (getgrist.com).

**Interface:** OpenAPI, from Grist's official API reference (`api/grist.yml` in [gristlabs/grist-help](https://github.com/gristlabs/grist-help), published at https://support.getgrist.com/api/). `generate.py` rebuilds `spec.ts` from it, dropping the enterprise SCIM paths, which the source file only references from other files. 119 tools, 75 of them mutations (all require approval). Source snapshot: `api/grist.yml` at gristlabs/grist-help commit `37cec9a3d1b0e0cc6af78e068663234eb4f6a1e7` (2026-07-15).

**Auth**

- API key. In Grist open Profile settings, then API, and create an API key. Enter the site (`docs` for personal areas, or your team name for `<team>.getgrist.com`) and the key. Sent as a bearer token.
- OAuth. In Grist open Account settings > Developer and create an OAuth app (confidential; Grist issues a client secret and requires PKCE). Register the Executor callback as a redirect URI (https, or http only for localhost). Scopes requested: `doc:read`, `doc:write`, `doc.schema:write`, `doc:download`, `doc:webhooks`, `user.profile:read`, `offline_access` (with `prompt=consent`, which Grist requires for refresh tokens). Endpoints come from `https://login.getgrist.com` discovery; the token endpoint uses `client_secret_basic`, which the discovery document lists as supported. OAuth accounts call the API on `login.getgrist.com` and have no site field. Grist accepts OAuth tokens on a curated subset only: tables, columns, records, attachments, downloads, webhooks, org and workspace listings, and the user profile. Every other tool returns 403 with an OAuth account; use an API key for those.

**Known gaps**

- Self-hosted Grist servers are not supported; credentials are only sent to `*.getgrist.com`.
- SCIM endpoints are omitted. Binary downloads and multipart uploads (document import, attachments upload) are limited by what the generic OpenAPI tools can express.
- One skipped operation: `GET /docs/{docId}/download/table-schema` (`docs.downloadTableSchema`), whose response schema references an external Frictionless JSON schema URL, which the compiler does not support.
