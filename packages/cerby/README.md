# Cerby

Accounts, secrets, collections, users, teams and (through a generic request tool) integrations, jobs and vaults in a Cerby workspace.

## Interface

Hand-written tools over the Cerby REST API v1 (`https://<workspace>.cerby.com/api/v1`), documented at https://developer.cerby.com/. Cerby publishes no downloadable OpenAPI document and no GraphQL or MCP endpoint, so there is no spec to compile. Dedicated tools cover accounts (including password and TOTP retrieval, and sharing), secrets, collections, users and teams. A `request` tool reaches the remaining endpoints (integrations, assets, entitlements, jobs, vaults). Every mutation requires approval.

## Auth

API key only. Cerby has no user-created OAuth apps. Sign in to the Cerby web app through your identity provider with a workspace Admin, Super Admin or Owner role, generate an API key (choosing read/write/delete scopes), and enter it with your workspace subdomain (`my-workspace` from `my-workspace.cerby.com`). The key is sent in the `x-api-key` header.

## Known gaps

- Only items on which the key's user holds the Owner role are returned; All-Access Mode is not supported.
- Account passwords can be retrieved only for accounts stored in an AWS KMS vault.
- Integrations, jobs and vaults have no dedicated tools; use `request`.
- The connection health check needs the "Read accounts" and "Read items" scopes.
