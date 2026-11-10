# Render

Manage Render services, deploys, Postgres databases, key-value stores, environment variables, custom domains, jobs, disks, projects and workspaces.

## Interface

Render's official public REST API, loaded live from the OpenAPI document at https://api-docs.render.com/openapi/render-public-api-1.json (API host `https://api.render.com/v1`). Mutations require approval.

## Auth

API key only. Create one in the Render Dashboard under Account Settings, then API Keys (https://dashboard.render.com/u/settings#api-keys). Keys look like `rnd_...` and are sent as a Bearer token. Render does not offer OAuth for the public API.

## Known gaps

API keys act as the user across all of their workspaces.

Tools come in two mounts. `api` is generated from the OpenAPI document (156 tools). `core` is hand-written with `fetch` (about 65 tools) for operations the compiler skips; every mutation in both needs approval. Hand-written tools take path ids as strings, optional `query` filters and, for writes, a JSON `body` that follows the Render API reference (https://api-docs.render.com/reference), so they do not validate body fields.

Why operations are skipped: the OpenAPI compiler only follows `$ref`s of the form `#/components/schemas/<name>`. Render's document is valid and every reference resolves, but many point to JSON pointers inside `paths` (for example `#/paths/~1services~1{serviceId}~1jobs/post/responses/201/content/application~1json/schema`) or to nested properties of another schema (for example `#/components/schemas/redisDetail/properties/maintenance`, `#/components/schemas/postgresPOSTInput/properties/plan`). The compiler rejects these with `schema_reference` (69 operations); one operation has an empty request body (`POST /services/{serviceId}/cache/purge`) and one references a path-level schema it cannot resolve (`PUT /build-sources/{buildSourceId}/env-vars`).

The skipped operations that matter are covered by `core`: list, create, retrieve and update of services (`GET/POST /services`, `GET/PATCH /services/{serviceId}`, so cron jobs are created here with `type: cron_job`), service events, preview instances, cache purge and autoscaling; one-off jobs (`/services/{serviceId}/jobs`); Postgres list, create, retrieve, update and recovery; Key Value create, retrieve and update; disks; environment groups; logs and log/metrics streams; notification settings; webhooks; workflows, tasks and task runs; Blueprints; build sources and maintenance runs.

Still not available: the legacy `/redis` endpoints (deprecated in favor of `/key-value`), and `PUT /build-sources/{buildSourceId}/env-vars` and `/secret-files` (array bodies). Render's hosted MCP server (https://mcp.render.com/mcp) is not used. It offers about 20 actions (create/list/get for services, Postgres and Key Value, deploys, logs, metrics) that `api` and `core` now cover over REST, but it also has a read-only SQL query tool for Postgres that this package lacks, because the REST API has no equivalent.
