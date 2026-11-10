# SeaTable

Work with a SeaTable base: rows, SQL queries, tables, columns, views, row links, comments, notifications, activity logs, snapshots, big data archiving and file assets (63 tools, plus a helper that returns the base UUID).

## Interface

OpenAPI 3.0. SeaTable publishes its API reference as official OpenAPI documents in https://github.com/seatable/openapi (the source of https://api.seatable.com). The package mounts `base_operations.yaml` (54 operations, under `base`) and `file_operations.yaml` (8 operations, under `files`) from the `v6.2` branch, which is the repository default. The account/team/admin documents are not mounted: they need an Account-Token, which is not offered here.

## Auth

API-Token (secrets). Fields: server (for example `cloud.seatable.io`) and the token. Create the token in the base: open the base menu, then API Tokens (read-only or read-write). One token is scoped to one base, so one account is one base. Base operations need a 3-day Base-Token; the package exchanges the API-Token for it through `/api/v2.1/dtable/app-access-token/` and caches it. `info.getBaseUuid` returns the base UUID that every base operation takes as `base_uuid`.

SeaTable has no OAuth. Mutations require approval.

The API-Token-only auth matches the Bearer scheme in the official OpenAPI documents and SeaTable's documented app-access-token exchange.

## Known gaps

- Only SeaTable Cloud hosts (`*.seatable.io`, `*.seatable.com`) are accepted; self-hosted servers are not, because the token is sent to the host entered.
- `uploadFile` (multipart POST to the upload link, path contains `?`) is skipped; upload links can be created with `files.filesImages.getUploadLink`.
- Account-level, team-admin and system-admin operations are not covered.
