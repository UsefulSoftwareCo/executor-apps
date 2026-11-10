# DevCycle

Manage DevCycle feature flags: projects, features, variables, variations, environments, targeting rules, audiences, overrides, custom properties, metrics and SDK keys.

**Interface:** OpenAPI. The tools are generated from DevCycle's official Management API document, https://api.devcycle.com/swagger.json (Management API, origin `https://api.devcycle.com`). The Bucketing API (https://bucketing-api.devcycle.com/openapi.yaml) is the end-user flag evaluation API used by server SDKs and is not exposed. DevCycle's hosted MCP server (https://mcp.devcycle.com/mcp, OAuth) is not mounted; it was not evaluated (its docs page could not be checked), so whether it offers anything beyond the Management API is unknown.

**Auth:** API credentials (client ID and secret). Use the client ID and secret from the DevCycle dashboard settings page (https://app.devcycle.com/r/settings), as described in https://docs.devcycle.com/management-api/. The package exchanges them at `https://auth.devcycle.com/oauth/token` with audience `https://api.devcycle.com/` for a short-lived bearer token and refreshes it automatically. The `Authorization: Bearer` header format and the 86400 s fallback token lifetime (used only when the response omits `expires_in`) are assumed; the vendor docs do not state either. This is done in code rather than with the generic OAuth client-credentials grant because DevCycle's token endpoint requires an `audience` parameter. There is no redirect URI.

**Approvals:** every mutating operation asks for approval.

**Known gaps:** the SDK-key based Bucketing/Client APIs are not included. Credentials are scoped to one organization; DevCycle's API is limited by the credential's role. Enterprise organizations with strict roles and permissions enabled must instead request tokens with `grant_type=refresh_token`, `client_id` and a `refresh_token` (no audience or secret); that flow is not supported because the vendor docs do not say how to obtain the refresh token, so those organizations cannot connect.
