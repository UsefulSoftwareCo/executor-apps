# KoboToolbox

Survey projects (assets), forms, deployments, submissions, exports, permissions, REST hooks, users and organizations on KoboToolbox.

Interface: OpenAPI 3.1, the official KPI API schema published by KoboToolbox at https://kf.kobotoolbox.org/api/v2/schema/ (docs at https://kf.kobotoolbox.org/api/v2/docs/). Mutations require approval.

Auth: API token. Find it in KoboToolbox via the profile icon > Account Settings > Security tab > click Display to reveal the key (it is hidden by default). It is also returned by `/token/?format=json` on your server (basic auth). The account also asks for the server you use: `kf.kobotoolbox.org` (global) or `eu.kobotoolbox.org` (EU). The token is sent as `Authorization: Token <token>`.

Known gaps: self-hosted KoboToolbox installs and other custom domains are not supported because credential hosts must be declared up front. The OpenRosa protocol endpoints are documented separately by KoboToolbox and are not covered. 15 operations that accept only SCIM bearer auth are skipped. No OAuth method is offered: the vendor docs (support.kobotoolbox.org/api.html) do not describe OAuth app creation, and the published schema declares only TokenAuth, BasicAuth and SCIM bearer security schemes with no OAuth2 authorize/token URLs or scopes. The schema prose mentions OAuth2 bearer credentials being accepted, but there is no documented way to obtain one, so it is not offered.

Verification: the spec and auth were checked against the vendor schema and docs only. KoboToolbox has no entry in integrations.sh (API key only), so cross-checks against it are not applicable.
