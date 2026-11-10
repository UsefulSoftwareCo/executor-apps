# BambooHR

Employees and the employee directory, time off, time tracking, benefits, training, applicant tracking, goals, company files, webhooks, reports and company settings in BambooHR.

**Interface:** the official BambooHR OpenAPI document, `https://openapi.bamboohr.io/main/latest/docs/openapi/public-openapi.yaml`, loaded live and compiled into 261 tools (137 mutations, every one asking for approval). Calls go to `https://<companyDomain>.bamboohr.com`.

**Auth:** API key. In BambooHR, open your profile menu, choose **API Keys** and add a key. Enter it with your company domain (the `acme` in `acme.bamboohr.com`). The key is sent as the HTTP Basic username, as BambooHR documents. Access is limited to what the key owner can see in BambooHR.

**Known gaps:**

- OAuth 2.0 is not offered. BambooHR supports user-created OAuth apps (developer portal), but its authorize and token URLs live on each company's own host (`<companyDomain>.bamboohr.com/authorize.php`, `token.php`) and the Executor framework declares `oauth2` `authorizationUrl`/`tokenUrl` as static strings with no per-account templating. Supporting it needs a framework change; until then those operations are unreachable.
- The spec is fetched from an unversioned `latest` URL, so operations may drift between deploys.
- 128 operations are skipped (`auth_method`). They accept only OAuth, a web session or registration tokens, never an API key, so an API key account cannot call them.
