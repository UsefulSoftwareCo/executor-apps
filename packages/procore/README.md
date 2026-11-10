# Procore

Companies, projects, directory users and vendors, RFIs, submittals, observations, punch items, meetings, documents and commitments (purchase orders, subcontracts, change order packages) in Procore: 27 tools plus `raw.request`, which reaches any other `/rest/` endpoint.

**Interface:** hand-written tools over the documented REST API (`https://api.procore.com/rest/v1.0/...`, reference at https://developers.procore.com/reference/rest). Procore publishes its reference only as a JavaScript app with no downloadable OpenAPI document, and the `procore/open-api-spec` GitHub repository is an unrelated Honest Buildings spec, so `operations.ts` wraps the endpoints. Procore has no GraphQL API or remote MCP server. Tools take path ids, a `query` object for filters, a `body` object for writes, and an optional `companyId` sent as the `Procore-Company-Id` header. Every mutation, including `raw.request`, requires approval.

**Auth:** OAuth 2.0 authorization code. Create an app in the Procore Developer Portal (https://developers.procore.com, My Apps), add Executor's redirect URI to the app's redirect URIs, and enter the client ID and secret when connecting. Authorization is at `https://login.procore.com/oauth/authorize` and tokens at `https://login.procore.com/oauth/token` (client secret in the body). Procore has no OAuth scopes: access follows the app's permissions and the user's own. Procore also offers client-credentials (service accounts) for company-level apps; that is not offered here.

**Icon:** Procore's app icon from `https://www.procore.com/images/apple-touch-icon-180x180.png` (180px); Simple Icons lacks Procore.

**Known gaps:** endpoints were written from Procore's documented API without being run against a live account; some endpoints have newer versions (v1.1 to v1.3), reachable through `raw.request`. Production only: Procore's sandbox uses separate hosts (`login-sandbox.procore.com`, `sandbox.procore.com`) that are not configured.
