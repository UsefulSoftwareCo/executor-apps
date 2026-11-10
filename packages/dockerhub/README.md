# Docker Hub

Repositories, tags, immutable tag rules, organizations, members, invites, teams (groups), personal and organization access tokens, audit logs and org settings on Docker Hub.

**Interface:** OpenAPI, Docker's official Docker Hub API document at https://docs.docker.com/reference/api/hub/latest.yaml (OpenAPI 3.2). Tools are generated live from it, every mutation requires approval.

**Auth:** one method, a username and access token. Create a personal access token at https://app.docker.com/settings/personal-access-tokens, or an organization access token under the organization's settings (use the organization name as the identifier). The package exchanges the identifier and token for a short-lived JWT via `POST /v2/auth/token` and caches it for a few minutes. Docker Hub has no user-created OAuth apps for this API. Organization access tokens only work on the namespace-scoped routes under `/v2/namespaces/{namespace}/repositories/` (plus operations whose description says they accept OATs); calls to other routes, including the legacy repository routes, fail with 403 `token issued from organization access token is not allowed`. Use a personal access token for those routes.

**Known gaps:**
- The token-minting operations (`/v2/auth/token`, the deprecated `/v2/users/login` and `/v2/users/2fa-login`) are removed from the tool set; the exchange in the package is the only auth path.
- The 9 SCIM provisioning operations (`/v2/scim/2.0/*`) need a separate SCIM token. The compiler drops them silently (the tool report shows 0 skipped), so the spec's 54 operations give 45 candidates, and removing the 3 token operations leaves 42 tools.
- The Docker Verified Publisher analytics API (`hub.docker.com/api/publisher/analytics/v1`) is not exposed: its only spec is a community conversion on apis.guru, not an official Docker document.
- No Docker-hosted remote MCP endpoint exists; the official `docker/hub-mcp` server runs locally (stdio by default, self-hosted HTTP optional), so the OpenAPI document is used instead.
- Image pushes and pulls go through the registry protocol, not this API.
