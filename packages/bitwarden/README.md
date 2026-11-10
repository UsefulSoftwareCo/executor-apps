# Bitwarden

Manage a Bitwarden organization: members, groups, collections, policies, event logs and directory import (not individual vault items).

**Interface:** hand-written tools over the Bitwarden Public API (https://bitwarden.com/help/public-api/). The vendor help page mentions a swagger.json, but the server (bitwarden/server `src/Api/Startup.cs`) serves it at `{api}/specs/public/swagger.json` only in Development or self-hosted builds; both cloud URLs return 404. The endpoints are therefore written by hand from the controllers in `src/Api/AdminConsole/Public/Controllers` and the docs (interface: custom). Mutations require approval.

**Auth:** organization API key (client credentials). An organization owner copies the `client_id` (`organization.xxxx`) and `client_secret` from Admin Console, Settings, Organization info, View API key. This is not the personal API key. Choose region `us` (bitwarden.com) or `eu` (bitwarden.eu). The package exchanges the key at `identity.bitwarden.*/connect/token` with scope `api.organization` and caches the bearer token.

**Gaps:** self-hosted instances are not supported (credentials hosts are fixed to the cloud regions). Vault item management is not covered. The official `@bitwarden/mcp-server` (npm) handles vault items through the local `bw` CLI plus org admin through the Public API, but it is local-only and warns against hosting, so it cannot replace this package in Executor; use it as the local alternative. The `/public/organizations` path is absent from the current server source, so it is omitted here. Subscription endpoints are not wrapped.
