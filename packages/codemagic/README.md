# Codemagic

Codemagic CI/CD for mobile apps: apps, builds and build actions, workflows, variable groups and variables, tester groups, teams and members, previews, dashboards, analytics, audit log, subscriptions and over-the-air updates.

**Interface:** OpenAPI, Codemagic's official v3 document at https://codemagic.io/api/v3/schema/openapi.json (97 operations, 36 of them mutations that require approval).

**Auth:** API token (`apiKey`), sent as the `x-auth-token` header. Find it under Account settings > API token in Codemagic (https://codemagic.io/user/preferences). The token carries the permissions of its user's team roles. Codemagic does not offer user-created OAuth apps.

**Known gaps:** The v3 API does not yet expose some v1 operations (https://docs.codemagic.io/rest-api/codemagic-rest-api/), such as cancelling a build, cache management and artifact public URLs. Starting a build is covered by `POST /api/v3/apps/{app_id}/builds`.

**Removed operations:** `/user/api-key` (GET returns the raw API token, DELETE revokes the token the connection uses) and `/builds/{build_id}/remote-access` (returns a VNC password) are patched out of the spec.

**Secret-bearing responses (disclosure):** `POST /ota/{team_id}/access-keys` returns the new key's `token` once; treat it as a secret. The variable endpoints (`/variable-groups/{id}/variables` and the app/team variants) return each variable's `value`. Codemagic's docs do not say whether `secure: true` values are masked (the schema allows `value` to be null), so assume they may be returned in plaintext.
