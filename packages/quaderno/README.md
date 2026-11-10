# Quaderno

Tax compliance for online sellers: tax calculation, invoices, credit notes, expenses, contacts, transactions, reports, checkout sessions and tax jurisdictions (88 tools, 47 of them mutations that ask for approval).

Interface: Quaderno's official OpenAPI document (version 20241028), https://developers.quaderno.io/redocusaurus/openapi-v20241028.yaml, downloaded by the app at runtime. The published document declares `openapi: "3.1"`, which the importer rejects, so `openapi.ts` patches it to `3.1.0`.

Auth: API key only. Create one at https://quadernoapp.com/users/api-keys. Quaderno sends it as the HTTP Basic username with a blank password. The account also needs your account name, the `ACCOUNT_NAME` in `https://ACCOUNT_NAME.quadernoapp.com`. For a sandbox account enter `ACCOUNT_NAME.sandbox-quadernoapp.com`. Credentials go only to `*.quadernoapp.com` and `*.sandbox-quadernoapp.com`. The health check calls `/api/ping`.

Known gaps: the four address operations (`addresses.*`) are marked `security: Bearer token`, which the spec defines as an OAuth2 authorizationCode flow (https://quadernoapp.com/oauth/authorize, https://quadernoapp.com/oauth/token, scopes `read_only` and `read_write`) for Quaderno Connect. Quaderno Connect requires the Business plan, and self-service OAuth app registration is not verified in the vendor docs, so OAuth is not declared and only the API key is offered. The importer also skips these operations as `invalid_document`: "The operation at #/paths/~1addresses/get/security/0/Bearer token is invalid: Expected array." The spec writes the requirement as `Bearer token: {}` instead of a scope array. Even with that fixed, calling them would need an OAuth token.

Spec currency: the pinned document (version 20241028, last modified 2026-08-10 on the vendor site) is the one the vendor docs serve. No newer document was found at a stable URL.

Hosts: the vendor docs also use the apex `sandbox-quadernoapp.com` in some examples. Only account subdomains (`*.quadernoapp.com`, `*.sandbox-quadernoapp.com`) are declared and called, so credentials are never sent to the apex.
