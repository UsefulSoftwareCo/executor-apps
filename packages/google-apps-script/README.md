# Google Apps Script

Manage projects and source files, versions and deployments; read script processes and metrics.
15 tools from Google's official Apps Script v1 Discovery document:
https://script.googleapis.com/$discovery/rest?version=v1. The checked-in OpenAPI conversion is
ours; regenerate with `node convert-discovery.mjs discovery.json openapi.json`.
All six mutations require approval.

OAuth uses Google discovery and requests `openid email profile` plus `script.projects`,
`script.deployments`, `script.processes` and `script.metrics` under
`https://www.googleapis.com/auth/`. Executor Cloud can offer its shared Executor for Google
client when configured with these scopes. Alternatively create a Google Cloud Web application
OAuth client, enable the Apps Script API, configure consent and register the callback URL shown
on Executor's connect page. Self-hosted operators configure their own client. Offline consent
requests a refresh token. Enable Apps Script API access in your Apps Script user settings:
https://script.google.com/home/usersettings. The user must have access to each target project.

`scripts.run` is excluded: execution needs the target script's own permissions, which this
provider does not request. This package manages source and deployments rather than executing
functions. Google project quotas still apply. Health reads only OpenID userinfo; it verifies
identity, not access to a specific script or API enablement. No service-account authentication.
