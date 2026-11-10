# Harness

Covers the Harness software delivery platform through its public REST API: pipelines and executions, services, environments, infrastructure, connectors, secrets, templates, triggers, feature flags, cloud cost management, security tests, registries and account administration.

**Interface:** OpenAPI, Harness's official bundled API reference at `https://apidocs.harness.io/_bundle/index.yaml?download` (OpenAPI 3.0, about 15 MB). Requests go to `https://app.harness.io`. Mutations require approval.

**Auth:** API key (`apiKey`). Create a personal access token (Profile > My API Keys > Token) or a service account token in Harness and paste it. It is sent in the `x-api-key` header. Harness has no user-created OAuth apps, so there is no OAuth method.

**Known gaps:**
- Only Harness SaaS Prod 1 (`app.harness.io`) is supported. Other clusters (`app3.harness.io`, ...), vanity URLs and self-managed installs are not.
- 179 operations are skipped by the compiler (173 declare auth methods other than `x-api-key`, 5 lack a server, 1 invalid document).
- The spec server is occasionally unavailable (HTTP 5xx) when fetched.
