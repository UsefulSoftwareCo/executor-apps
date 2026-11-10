# Peerdom

Covers the Peerdom public API for an organization: peers, roles and role holders, groups, projects, goals, maps, pages, cards, custom fields, tenant details and app activation.

Interface: OpenAPI. Peerdom publishes its official OpenAPI 3.0 document only inside its docs page (https://api.peerdom.app/v1/docs, Redoc) and serves no standalone spec URL, so `spec.json` is that embedded document copied unchanged. Refresh it from the docs page if the API changes. Requests go to `https://api.peerdom.app/v1`.

Auth: the REST API accepts only the `X-Api-Key` header, so this package uses an API key. Create it in Peerdom under Settings > My Data > API Keys (this requires Owner access); the key scopes all calls to that one organization. API access requires a paid plan (Peerdom+) or an active trial.

Peerdom also runs an official hosted MCP server at `https://mcp.peerdom.org/mcp`. It uses OAuth discovery in its metadata and is not packaged here. Its tool count is unverified, because unauthenticated `tools/list` is blocked and connecting an account is out of scope. OpenAPI was chosen because the official, stable, docs-embedded spec documents 55 operations.

Known gaps: mutations require approval. The legacy `/circles` endpoints are deprecated aliases of `/groups`.
