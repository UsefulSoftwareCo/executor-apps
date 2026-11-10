# Buildkite

Pipelines, builds, jobs, agents, clusters, queues, teams and more, exposed as two tool sets mounted side by side.

**Interfaces:**
- `rest.*`: 55 hand-written tools over Buildkite's official REST API at https://api.buildkite.com/v2 (docs: https://buildkite.com/docs/apis/rest-api). Covers pipelines, pipeline templates, builds, jobs (retry, cancel, unblock, log, env), annotations, artifacts, agents, clusters, queues, teams, rules, audit events, Test Engine suites, and the current user/token. Buildkite publishes no OpenAPI document for the main REST API (only https://api.buildkite.com/v2/analytics/openapi.yaml for Test Engine), hence hand-written. Path IDs are passed as inputs; request bodies go in `body`, filters and pagination in `query`.
- `graphql.*`: tools generated at runtime by introspection of Buildkite's official GraphQL API at https://graphql.buildkite.com/v1 (docs: https://buildkite.com/docs/apis/graphql-api). Queries are read tools; mutations require approval. The number of GraphQL tools was not measured (needs a token), and it was not claimed that GraphQL is more complete than REST. This path was deployed but its live introspection was not exercised.

All REST mutations (POST/PUT/PATCH/DELETE) and GraphQL mutations require approval.

**Auth:** API access token, created at https://buildkite.com/user/api-access-tokens (the GraphQL docs say the token needs the "Enable GraphQL API Access" permission; REST needs the scopes of the endpoints used). Sent as `Authorization: Bearer <token>`. The health check calls `GET /v2/access-token`, which needs no scope and always returns a `uuid`. OAuth was not checked and is not offered.

**Official MCP server:** Buildkite publishes https://github.com/buildkite/buildkite-mcp-server. It is self-hosted (stdio or a self-run HTTP server using an API token); no hosted remote URL was found, so it is not used.

**Known gaps:** REST coverage is the common operations, not all ~40 families (for example hosted agent images, portals, registries and package endpoints are reachable only through GraphQL if at all). The REST paths were written from the docs and not called live.
