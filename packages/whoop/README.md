# WHOOP

Recovery, sleep, physiological cycles, workouts, body measurements and basic profile from the WHOOP developer API.

**Interface:** OpenAPI. WHOOP's official document at https://api.prod.whoop.com/developer/doc/openapi.json, loaded live. Mutations (revoking access, adding test data) require approval.

**Auth:** OAuth 2.0 only; WHOOP has no personal API keys. Create an app at https://developer-dashboard.whoop.com, then enter its client ID and secret on the connect page. Add Executor's redirect URI to the app's redirect URIs. Scopes requested: `offline` (refresh tokens), `read:recovery`, `read:cycles`, `read:workout`, `read:sleep`, `read:profile`, `read:body_measurement`.

**Gaps:** the 8 `/v2/partner/*` operations that use WHOOP's trusted-partner client-credentials scheme are skipped (`auth_method`); they need a partner token this package does not obtain. `POST /v2/partner/token` and development test-data endpoints declare no security in the spec and are still exposed.
