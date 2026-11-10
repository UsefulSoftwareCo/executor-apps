# AppVeyor

Manage AppVeyor CI/CD: projects and their settings, builds and job logs, deployment environments, deployments, users, collaborators and roles (45 tools).

Interface: hand-written tools over the REST API at `https://ci.appveyor.com/api`, following the vendor's documentation (https://www.appveyor.com/docs/api/). AppVeyor publishes no official OpenAPI document; the only Swagger definition is the unofficial community `kevinoid/appveyor-swagger`, which is not used. Every mutation requires approval.

Auth: API token (`apiKey`). Create one at https://ci.appveyor.com/api-keys and paste it; it is sent as `Authorization: Bearer <token>`. AppVeyor has no user-created OAuth apps.

Known gaps: the vendor overview says user-level (v2) API keys need a `/api/account/<account>/` path prefix; this package calls un-prefixed `/api/...` paths and does not add it, so use a token that works without the prefix. The api-keys page is login-gated and its key types were not confirmed. `projects.updateSettingsYaml` sends the YAML as `Content-Type: text/plain`; the vendor labels the body `plain/text` and documents no header, so this is unverified against a live account. Build artifact download and the Build Worker API (available only inside build VMs) are not covered.
