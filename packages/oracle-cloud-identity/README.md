# Oracle Cloud Identity

Covers the REST API of Oracle Cloud Identity (Oracle Identity Cloud Service, the engine behind OCI IAM identity domains) for one identity domain: users, groups, applications, app roles, identity providers, policies, MFA and password settings, audit events, bulk operations and more, 1036 tools in all (522 mutations, each requiring approval). Search operations (`POST .../.search`) are POSTs, so they also ask for approval.

Interface: Swagger 2.0, Oracle's own "REST API for Oracle Identity Cloud Service" document at https://docs.oracle.com/en/cloud/paas/identity-cloud/idcsa/swagger.json (the Swagger download for https://docs.oracle.com/en/cloud/paas/identity-cloud/rest-api/rest-endpoints.html). It declares no host, so each account's own identity domain URL (`https://idcs-<32 hex>.identity.oraclecloud.com`) is used and credentials only go to that origin.

Auth: two methods, both asking for the identity domain URL (for example `https://idcs-1234567890abcdef1234567890abcdef.identity.oraclecloud.com`, shown on the domain's overview page in the OCI console).
- Confidential application (client credentials): in the identity domain console, Integrated applications > Add application > Confidential Application, enable the Client credentials grant, and under Resources add an app role such as Identity Domain Administrator (or a narrower one). Copy the client ID and secret. Executor exchanges them at `<domain>/oauth2/v1/token` (HTTP Basic, scope `urn:opc:idm:__myscopes__`) and renews the token as it expires. This is done in code because the token endpoint is on the per-tenant host, which the framework's `oauth2` method cannot express.
- Access token: paste a bearer token minted elsewhere.

No OAuth authorization-code app is offered: Oracle's admin API is meant to be driven by a confidential application's app roles.

Known gaps: the provider `hosts` is `*.identity.oraclecloud.com`, so identity domains in other realms (gov or dev domains) are not accepted. Oracle's document is 12 MB, so the first tool listing is slow. Which operations succeed depends on the app roles granted to the application. No live call was made with credentials.
