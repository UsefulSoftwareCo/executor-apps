# Paradym

Issue, verify and manage verifiable credentials (OpenID4VC, SD-JWT VC, AnonCreds) with Paradym: wallets, templates, credentials, presentations, webhooks and members.

Interface: OpenAPI, from Paradym's official document at https://api.paradym.id/openapi.json (103 operations, all under `/v1/wallets/**`; the spec mentions `/v1/projects` only as deprecated in prose and defines no such paths).

Auth: API key only (Paradym has no OAuth). Create one under Settings > API keys at https://paradym.id/app/settings/api-keys. It is sent in the `x-access-token` header. Every mutation requires approval.

