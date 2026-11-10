# Appcircle

Appcircle mobile CI/CD: build profiles, branches, workflows and builds, testing distribution, publish flows and store submissions, signing identities, store credentials, the Enterprise App Store, reports, webhooks, tasks and licenses.

**Interface:** OpenAPI. Appcircle publishes one official OpenAPI 3 document per module, listed in the Swagger UI at https://api.appcircle.io/openapi/index.html and served at `https://api.appcircle.io/openapi/modules/<module>`. The package mounts twelve modules (build, distribution, publish, signing-identity, store-credential, store, store-report, report, webhook, task, license, identity) under their own keys in one router: about 281 tools. The auth module is not mounted; the package performs the token exchange itself. All modules share `https://api.appcircle.io`. Mutations require approval.

**Auth:** Personal Access Key (API key). Create it in the Appcircle dashboard under Organization, Security (Personal Access Keys). The key is organization specific. The package exchanges it at `https://auth.appcircle.io/auth/v3/token` and sends the resulting token as a bearer token (about 4 hours, renewed automatically; no `scope` is requested, so the default `openid profile email` applies). Appcircle does not offer user-created OAuth apps.

**Known gaps:**
- Self-hosted Appcircle installations use their own hostnames and are not supported.
- 32 operations are skipped by the OpenAPI compiler (`operation_path`, plus one `schema_reference` in signing-identity), mostly in build, distribution and publish.
- File upload endpoints (app binaries, certificates) are multipart and may not be usable.
