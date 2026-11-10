# LaunchDarkly

Feature flags, projects, environments, segments, experiments, members, audit log, webhooks and the rest of the LaunchDarkly REST API (401 tools, 207 of them mutations that require approval).

**Interface:** OpenAPI, LaunchDarkly's official document at https://app.launchdarkly.com/api/v2/openapi.json. Operations run against https://app.launchdarkly.com.

## Auth

- **API access token** (`apiKey`): create one under Organization settings > Authorization > Access tokens (https://app.launchdarkly.com/settings/authorization). It is sent as the raw `Authorization` header, as the API expects.
- **OAuth** (`oauth`): LaunchDarkly has no self-serve OAuth app page; register a client with the OAuth2 clients API (`POST /api/v2/oauth/clients`, needs an Admin token) and paste its client ID and secret on the connect page. Use the redirect URI Executor shows (one HTTPS redirect URI per client). Endpoints are discovered from https://app.launchdarkly.com/.well-known/oauth-authorization-server; scopes are `reader`, `writer` and `offline_access`. The vendor's authentication page does not mention OAuth; the evidence is the RFC 8414 metadata and the caller-identity `clientName` field, documented as "only present for OAuth access tokens". OAuth is unverified until a live connection succeeds. The token endpoint is called with `client_secret_basic`. Unverified clients only work for members of your own LaunchDarkly organization.

## Known gaps

- The EU/Federal instances (app.eu.launchdarkly.com, app.launchdarkly.us) are not supported: the package targets the default commercial origin only.
- The hosted MCP server and webhook triggers are not covered.
