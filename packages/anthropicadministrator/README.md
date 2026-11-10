# Anthropic Administrator

Manage an Anthropic organization through the Admin API: members and roles, invites, workspaces and workspace members, API key audit and disabling, usage and cost reports, Claude Code analytics, and rate limits (27 tools).

**Interface:** hand-written tools using `fetch` against `https://api.anthropic.com/v1/organizations/...`, from the official docs at https://platform.claude.com/docs/en/manage-claude/admin-api. Anthropic publishes the API reference at https://platform.claude.com/docs/en/api/organization but no stable public OpenAPI URL, so no spec is compiled. Mutations require approval.

**Auth:** Admin API key only. An organization admin creates one in the Claude Console (Settings, Admin keys); it starts with `sk-ant-admin`. It is sent in the `x-api-key` header with `anthropic-version: 2023-06-01`. A personal or service account key that is not workspace-scoped also works. The Admin API is unavailable for individual accounts.

**Known gaps:**
- No OAuth: the documented `org:admin` token comes from the `ant` CLI login, and no third-party OAuth app registration is documented.- Not exposed: `users.list` `roles[]` filter, and the `inference_geos[]` and `speeds[]` usage filters.
- Service accounts, federation issuers and rules (OAuth token only), external (CMEK) keys, Enterprise group, custom role and spend limit endpoints, workspace rate limit writes, and the Compliance API are not exposed.
- API keys can be listed, renamed and disabled but not created; creation is Console-only.
- Health check calls `GET /v1/organizations/me`. Not verified against a live key.
