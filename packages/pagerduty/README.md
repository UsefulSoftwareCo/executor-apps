# PagerDuty

Incidents, services, schedules, escalation policies, users, teams, on-calls, notifications, event orchestrations, analytics and the rest of the PagerDuty REST API v2.

**Interface:** OpenAPI, loaded from PagerDuty's official description at
https://raw.githubusercontent.com/PagerDuty/api-schema/main/reference/REST/openapiv3.json
(`api.pagerduty.com`). Every mutation requires approval.

**Auth**

- REST API key: create one under Integrations > API Access Keys (account-level) or a user's
  Profile > User Settings > Create API User Token. Sent as `Authorization: Token token=<key>`.
- OAuth: register an app under Integrations > App Registration, enable OAuth 2.0, and use
  `https://identity.pagerduty.com/oauth/authorize` and `/oauth/token`. Add Executor's callback URL
  shown on the connect page as the app's redirect URI. Scopes requested are `read write`
  (classic user OAuth); PagerDuty ignores invalid scopes, so check the token's granted scope.

**Spec patches:** the official description references nested schema locations (for example `#/components/schemas/Tag/allOf/0`) that the compiler cannot follow, which skipped about 200 operations. `patches.ts` (generated from the document) copies those targets into components and repoints the references, so all 466 operations compile. The generator script was not kept. To audit the patch set, collect every `$ref` in the official document whose pointer has more than three segments after `#/components/schemas/` (for example `/allOf/0` or `/oneOf/1`), check that `patches.ts` adds a component for each target and rewrites the referring location, and confirm with `scripts/check.sh pagerduty` that 466 tools compile with 0 skipped.

**OAuth endpoints:** This package follows PagerDuty's OAuth documentation (`identity.pagerduty.com/oauth/authorize` and `/oauth/token`). Both hosts are listed in `hosts` because the client secret and tokens go to the identity host.

**Known gaps**

- Events API v1/v2 (`events.pagerduty.com`, routing-key auth, different host) and the PagerDuty
  remote MCP server (`mcp.pagerduty.com`) are not included.
- Scoped OAuth requires PKCE and per-resource scopes; only the classic `read`/`write` scopes are requested.
- The health check calls `/abilities` and returns a constant account identity, since the endpoint and account-level keys carry no identifier (`/users/me` only works for user tokens).
