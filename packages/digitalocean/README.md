# DigitalOcean

Droplets, Kubernetes, managed databases, Spaces keys, domains, load balancers, firewalls, volumes, VPCs, App Platform, container registry, monitoring, billing and the rest of the DigitalOcean public API (775 tools, all calls through `api.digitalocean.com`).

## Interface

OpenAPI, from DigitalOcean's official published document:
https://api-engineering.nyc3.cdn.digitaloceanspaces.com/spec-ci/DigitalOcean-public.v2.yaml
(source repository: https://github.com/digitalocean/openapi). Every mutation requires approval.

## Auth

- **Personal access token** (`token`): create one at https://cloud.digitalocean.com/account/api/tokens and choose read-only or full access scopes. Sent as a bearer token.
- **OAuth 2.0** (`oauth`): register an OAuth application at https://cloud.digitalocean.com/account/api/applications and enter its client ID and secret on the connect page. Add Executor's redirect URI shown there as the application's callback URL. Scopes requested: `api:read api:write`, the alias scopes named on DigitalOcean's token scopes page (https://docs.digitalocean.com/reference/api/scopes/) and referenced by the OAuth authorize docs; the legacy `read`/`write` names are not documented there, so they are not used. Hosts: credentials go to `api.digitalocean.com` (API calls) and `cloud.digitalocean.com` (authorize, token exchange and refresh, which send the client secret and refresh token in the request body).

Health check: `GET /v2/account`.

## Known gaps

- The serverless inference (`inference.do-ai.run`), per-agent chat and batch-upload endpoints that the spec lists are removed with patches: they live on other origins and use model access keys rather than the API token.
- Spaces object storage (S3-compatible, per-region hosts) is not covered; only Spaces key management is.
