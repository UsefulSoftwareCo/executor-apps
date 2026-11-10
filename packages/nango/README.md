# Nango

Covers the Nango HTTP API: providers, integrations, connections (including credentials and metadata), syncs and sync records, action triggers, functions (compile, dry run, deploy), environments, API keys, environment variables, the authenticated proxy and Connect sessions.

Interface: OpenAPI, loaded live from Nango's official spec at https://nango.dev/docs/spec.yaml (base URL https://api.nango.dev). Mutations require approval.

Auth: two API key methods, both sent as `Authorization: Bearer <key>` to api.nango.dev. Nango has no user-created OAuth apps for its own API.
- Environment API key: create it in the Nango dashboard under Environment Settings > API Keys. It covers every tool except the account-level ones below.
- Account API key: create it in your Nango account settings. Nango rejects it on environment endpoints and rejects environment keys on account endpoints, so the seven account-level tools (`environments.getEnvironments`, `postEnvironments`, `deleteEnvironments`, `getApiKeys`, `postApiKeys`, `getApiKeysByKeyUuid`, `deleteApiKeys`) are exposed only to accounts connected with an Account API key, and all other tools only to accounts connected with an Environment API key. Connect two accounts to use both sets.

Sensitive reads: `GET /connection/{connectionId}` (and its deprecated variants) return stored third-party credentials (access and refresh tokens), and `getApiKeysByKeyUuid` returns an API key secret. These are query tools, so they run without approval; only mutations require approval.

Known gaps: the spec lists a localhost server, which is ignored. Self-hosted Nango instances (other base URLs) are not supported; only api.nango.dev. The health check calls `GET /integrations`, so a key without that scope reports unhealthy. The health check calls `GET /integrations` (or `GET /environments` for an Account API key), so a key without that access reports unhealthy. One operation is skipped: `POST /connect/sessions/reconnect` (`connect.postSessionsReconnect`), because its schema references `#/components/schemas/ConnectSessionInput/properties/tags`, a reference form the compiler does not support. Use `POST /connect/sessions` or the Nango dashboard for reconnect sessions.
