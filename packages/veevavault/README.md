# Veeva Vault

Veeva Vault content and data for life sciences teams: documents (fields, versions, roles, renditions, attachments, create/update/delete), binders, object records (products, studies and custom objects), VQL queries, users and groups, picklists and jobs. `api.get` and `api.request` reach any other endpoint of the Vault REST API (workflows, lifecycles, file staging, Vault Loader, and so on).

## Interface

Hand-written tools over the Vault REST API, `https://{vaultDNS}/api/{version}`, documented at https://developer.veevavault.com/api/ (https://general.veevavault.dev/vault-api/api-reference). Veeva publishes no OpenAPI document and no official remote MCP server (the docs offer a Postman collection only), so the most-used endpoints are written by hand, with the generic `api.*` tools covering the rest. The default API version is `v25.3`; an account can name another one.

## Auth

User name and password (`password` method). The account asks for:

- Vault DNS: the host of your Vault URL, for example `mycompany-quality.veevavault.com` (only `*.veevavault.com` hosts are accepted).
- User name and password of a Vault user with API access (the API Access permission and a security profile allowing the operations you need).
- API version, optional (for example `v25.3`; blank uses the default).

Each tool call signs in with `POST /auth`, sends the returned session ID in the `Authorization` header, and ends the session afterwards, so sessions are not left open. Users who sign in with SSO need a Vault-native service account for API access.

## Known gaps

- OAuth 2.0 / OpenID Connect is not offered: it needs a security policy and OAuth profile configured per vault by a Vault administrator, so there is no app registration a user can complete on their own.
- File upload and download (document content, renditions, file staging) are binary or multipart and are not covered by dedicated tools; a document can be created from a file already in file staging.
- Each call signs in separately; very chatty use can hit Vault's login rate limits.
- Written against the documentation and not exercised against a live vault.
