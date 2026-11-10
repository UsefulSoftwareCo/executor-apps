# ConductorOne

Covers the ConductorOne (now branded C1) identity governance API for one tenant: apps, entitlements, access requests and reviews, policies, users, groups, tasks, automations and more.

**Interface:** OpenAPI. The official C1 API document that ConductorOne's SDKs are generated from, `https://insulator.conductor.one/api/v1/openapi.yaml` (about 800 operations, loaded live). Its server is `https://{tenantDomain}.conductor.one`; each account pins its own tenant.

**Auth:** client credentials only (ConductorOne offers no static token or user-created OAuth app). In the ConductorOne web app open your name at the bottom left, choose AI & API (formerly API Keys), and create a client. Enter the tenant hostname from the client ID (the part after `@`, for example `acme.conductor.one`), the client ID and the client secret (shown once). The package exchanges them at `https://<tenant>/auth/v1/token` (credentials in the form body) and caches the token until shortly before it expires. Credentials are sent only to `*.conductor.one`.

**Known gaps:** only `*.conductor.one` tenant hostnames are accepted. The signed-client-assertion token option is not supported. Mutations require approval. The spec is large, so the first tool listing is slow.
