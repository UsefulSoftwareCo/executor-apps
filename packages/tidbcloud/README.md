# TiDB Cloud

Manage TiDB Cloud Starter, Essential and Dedicated clusters, branches, backups, imports, exports, changefeeds, audit logs, private links, data migrations and organization IAM (API keys, projects).

## Interface

OpenAPI, from TiDB Cloud's own Swagger 2.0 documents in the official [tidbcloud/tidbcloud-cli](https://github.com/tidbcloud/tidbcloud-cli/tree/main/pkg/tidbcloud/v1beta1) repository (`dedicated`, `iam` and the `serverless/*` documents). Each document is mounted under its own key (`dedicated`, `clusters`, `branches`, `backups`, `imports`, `exports`, `changefeeds`, `auditLogs`, `privateLinks`, `migrations`, `iam`) in one router. The documents span three origins: `dedicated.tidbapi.com`, `serverless.tidbapi.com` and `iam.tidbapi.com`.

## Auth

API key (`apiKey`): in the TiDB Cloud console open Organization Settings > API Keys, create a key and copy both the public key and the private key (the private key is shown once). The API uses HTTP Digest authentication with the public key as username and the private key as password. The documents declare no security scheme, so the package carries the pair as Basic credentials and `digest.ts` (a fetch wrapper with its own MD5) answers the server's Digest challenge.

TiDB Cloud also accepts OAuth tokens, but only through its CLI's device flow; users cannot register an OAuth app, so none is offered.

## Known gaps

- The Billing API (`billing.tidbapi.com`) and Data Service have no published document in the official repository and are not covered.
- The Swagger documents are fetched from the repository's `main` branch, so the tool list follows upstream.
- `scripts/tools.ts` counts only the Dedicated document; the Starter and Essential areas add to this at runtime.
