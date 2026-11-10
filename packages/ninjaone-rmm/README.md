# NinjaOne RMM

Covers the NinjaOne RMM public API: organizations, locations, devices, tickets, alerts, policies, scripting, patching, backup and the rest of API 2.0, 315 tools in all (164 mutations, each requiring approval).

Interface: OpenAPI 3.0, NinjaOne's official document at https://app.ninjarmm.com/apidocs/NinjaRMM-API-v2.json. The document declares no servers, so each account's own instance host is used as the base URL, and credentials are only ever sent to that origin (it must be a `ninjarmm.com` host).

Auth: one method, API client credentials. In NinjaOne open Administration > Apps > API, add a client app of type "API Services (machine-to-machine)" with the client credentials grant, and copy the Client ID and secret; enable the monitoring, management and control scopes the tools need. When connecting, enter the instance host (`app.ninjarmm.com`, `us2.ninjarmm.com`, `eu.ninjarmm.com`, `ca.ninjarmm.com` or `oc.ninjarmm.com`), the Client ID and the secret. Executor exchanges them for a bearer token at `https://<instance>/ws/oauth/token` (scopes `monitoring management control`) and renews it as it expires. The grant is performed in code rather than with the framework's `oauth2` method because the token endpoint is on the tenant's own instance. The authorization-code flow (user-delegated OAuth) is not offered.

Known gaps: the document's cookie `sessionKey` scheme is not used. The icon is NinjaOne's 300px favicon-2024 app icon from ninjaone.com, since no SVG mark is published.
