# Polar Signals

Inspect Polar Signals continuous profiling data: list projects, profile types (CPU, memory, ...), label names and values, and query profiles to find performance regressions. Also covers the catalog target "Polar Signals MCP".

**Interface:** Polar Signals' official remote MCP server, `https://api.polarsignals.com/api/mcp` (docs: https://www.polarsignals.com/docs/mcp). The MCP docs page links no OpenAPI document for this surface, and none was found. Tools are discovered from the server at connect time; every tool not annotated read-only requires approval.

**Auth:** OAuth 2.0 only. The server publishes RFC 8414 metadata (`https://api.polarsignals.com/.well-known/oauth-authorization-server`) and Executor discovers it from the MCP URL; the user signs in with their Polar Signals account. The token endpoint is `identity.polarsignals.com`, so both hosts are declared. Scopes requested: `openid profile email offline_access` (`offline_access` for refresh tokens; the metadata also lists `groups`, not requested). The metadata advertises dynamic client registration (`/api/oauth/register`), so no manual OAuth app should be needed. No API-key method is offered: the vendor MCP docs only say to authenticate from the dashboard's AI section and mention no key or token, but no user-created bearer key could be confirmed (the dashboard was not accessible). Add a `secrets` method if one is documented.

**Known gaps:** no API key auth (unconfirmed whether one exists); the tool set is whatever the server exposes (the docs list get_projects, profile_types, labels, values, get_profile; unverified against the live server).
