# Xata

Manage the Xata managed Postgres platform: organizations and members, projects, branches, branch credentials, backups, API keys, metrics, logs, regions and billing.

**Interface:** OpenAPI, from Xata's official document at https://api.xata.tech/openapi.json (control plane, `https://api.xata.tech`).

**Auth:** API key only. Create an organization API key in the Xata console (or with the `xata` CLI) and paste it; it is sent as `Authorization: Bearer <key>`. The spec's OAuth/OIDC scheme only declares an implicit flow for Xata's own clients, so OAuth apps are not offered.

**Known gaps:** 77 operations are exposed. The spec marks operations with an OAuth scheme (implicit flow, for Xata's own clients) but Xata accepts the API key on all of them, so the package maps that scheme to the bearer key. The branch-scoped SQL gateway (`/sql`, `/v2`, on `https://{branch}.{region}.xata.tech`) is skipped (different origin; it needs a branch connection string). `/mcp` is also left out.
