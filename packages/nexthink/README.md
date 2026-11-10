# Nexthink

Covers the Nexthink public API: running saved NQL queries and exports, listing and triggering remote actions and workflows, sending campaigns, enriching devices, users, binaries and packages with custom field values, and scheduling device deletions. 14 tools, 8 of them mutations that require approval.

Interface: hand-written tools over the REST endpoints documented at https://docs.nexthink.com/api (Nexthink publishes the API reference as documentation pages, with no downloadable OpenAPI document). Each account's own API host `https://<instance>.api.<region>.nexthink.cloud` is the base URL.

Auth: one method, API client credentials (OAuth 2.0 client credentials grant, scope `service:integration`). In Nexthink open Administration > Account Management > API credentials > New OAuth client credentials, grant the API permissions you need (NQL, Remote Actions, Workflows, Campaigns, Enrichment, Data management) and copy the Client ID and secret (shown once). When connecting, enter the instance name, the region (`us`, `eu`, `pac` or `meta`), the Client ID and the secret. The token is requested from `https://<instance>-login.<region>.nexthink.cloud/oauth2/default/v1/token` and renewed before its 15-minute expiry. The grant is performed in code rather than with the framework's `oauth2` method because the token host contains the customer's instance and region. No redirect URI is involved.

Known gaps: the Spark handoff and Hypervisor APIs, and the campaign status and answers endpoints, are not included (not documented publicly or tied to specific licenses). Which tools work depends on the permissions of the credentials and the instance's license.

The connection check mints a token only: Nexthink has no current-user endpoint, so it confirms the instance, region and credentials but not which API permissions were granted. The client secret is held as a handle and only sent to Nexthink's regional `nexthink.cloud` hosts; the Basic header sent to the token endpoint has the handle substituted by Executor.
