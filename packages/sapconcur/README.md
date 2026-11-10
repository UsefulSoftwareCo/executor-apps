# SAP Concur

Expense reports, entries, itemizations and allocations, travel and expense requests, trips, invoice payment requests, purchase orders, vendors, custom lists, locations and users for one SAP Concur company, plus generic REST access to any other Concur API.

**Interface:** hand-written tools over SAP Concur's official REST APIs at `https://{geolocation}.api.concursolutions.com` (documented at https://developer.concur.com/api-reference/). Concur publishes Swagger only inside its login-gated API Explorer, so no spec is compiled. 31 tools cover the common v3.0 expense and invoice endpoints, identity v4.1, Request v4 and Trip v1.1; `rest.get` and `rest.send` reach everything else (Expense v4, Budget v4, Cards v4, ...). All writes require approval. Paths follow the documented conventions and were not exercised against a live company.

**Auth:** two methods, both against your data center's geolocation host (for example `us.api.concursolutions.com`, `eu.api.concursolutions.com`; find it on https://developer.concur.com/platform/base-uris.html).
- Company-level app (client credentials): the client ID and secret of an app created in SAP Concur's App Management (see https://developer.concur.com/api-reference/authentication/oauth2-app-mgmt-tool.html), which the company has authorized through the company request token process. Executor requests `grant_type=client_credentials` at `/oauth2/v0/token` and renews the one-hour token itself.
- OAuth access token: a bearer token you obtained elsewhere (for example from the authorization code or password grant). It is used as-is, is not refreshed, and expires after an hour.

**OAuth gap (accepted):** Concur's authorization code flow authorizes on a per-region `www-` host and exchanges the code at the global `glz` host, then returns the user's geolocation in the redirect. That does not fit a fixed provider declaration, so no browser `oauth2` method is offered. Which calls succeed depends on the scopes granted to the app: no scope is sent in the token request, so scopes come from the app registration in App Management. The health check only mints the token (client credentials) or, for a pasted token, probes `api/v3.0/common/lists?limit=1` and accepts a 403, so it needs no particular scope.

**Company authorization (done by you):** a company-level app only works after a Concur administrator authorizes it for the company with the one-time company UUID and company request token (https://developer.concur.com/api-reference/authentication/oauth2-app-mgmt-tool.html). Executor does not collect those values; complete that step in Concur before connecting.

**Spec check:** SAP Business Accelerator Hub (api.sap.com) lists Concur APIs as documentation pages, and I found no downloadable OpenAPI files for them (not confirmed by direct browsing; web search was unavailable), so the tools stay hand-written.

**Known gaps:** the named tools use the v3.0 APIs that Concur is gradually replacing with v4 equivalents. Use `rest.*` for v4 services. Icon: the boxed Concur C cropped (viewBox only) from SAP Concur's official logo, Wikimedia Commons "Logo of SAP Concur (2020).svg".
