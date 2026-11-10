# WorkOS

Organizations, User Management users and sessions, SSO connections, Directory Sync, FGA/RBAC authorization, audit logs, Admin Portal, webhooks and more on WorkOS.

**Interface:** OpenAPI, from WorkOS's official spec repository, https://github.com/workos/openapi-spec (`spec/open-api-spec.yaml`). Only the production origin `https://api.workos.com` is used.

**Auth:** API key (`apiKey`). Use a WorkOS API key (`sk_...`) from the WorkOS dashboard (https://dashboard.workos.com); it is sent as `Authorization: Bearer`. Use a production key: the staging server (`https://api.workos-test.com`) is excluded, so staging keys are never sent to the production origin. WorkOS has no user-created OAuth apps for its management API, so OAuth is not offered.

**Icon:** WorkOS's official app icon (256px PNG from workos.com); Simple Icons has no WorkOS entry and no SVG is published.

**Gaps:** The official hosted Management MCP server (`https://mcp.workos.com/mcp`) uses dashboard OAuth and was not used; the REST API has more operations. Endpoints authenticated by SSO access tokens or client IDs rather than the API key are called with the API key and may be rejected. About 33 of the spec's operations carry an `x-feature-flag` (beta endpoints, e.g. `agent-blueprints-public-api`); they are included and may return errors for accounts without the flag. Every mutation requires approval.
