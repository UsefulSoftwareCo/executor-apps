# Medallia

Medallia Experience Cloud: user and role administration (Admin API), GraphQL queries over feedback and CX data (Query API), and record imports with asynchronous feed-file status (Import API).

**Interface:** custom hand-written tools (17) over Medallia's REST and GraphQL APIs. Medallia publishes no downloadable OpenAPI document (its reference pages at https://developer.medallia.com/medallia-apis are rendered from per-tenant specs), so the tools follow the developer portal: `/admin/v1/users`, `/admin/v1/roles`, `/data/v0/query`, `/inbound/v1/{importer}`, `/inbound/v2/...`. The Query API path `/data/v0/query` is confirmed by the vendor reference implementation (https://github.com/medallia/query-api-data-extract, `application.properties.template`: `https://<company>.apis.medallia.com/data/v0/query`); the Query API Specification (https://developer.medallia.com/medallia-apis/reference-link/query) and overview (https://developer.medallia.com/medallia-apis/reference/query-api-overview) describe the POST JSON body with `query` and `variables`.

**Auth:** OAuth 2.0 client credentials, the only grant Medallia offers. Ask your Medallia administrator for an API client (client ID and secret) whose role has the capabilities you need (Admin API, Query API, import). Enter the five account fields:

- Reporting instance: host that issues tokens, for example `instance.medallia.com`
- Tenant name: your company/tenant name in the token URL `https://<instance>/oauth/<tenant>/token`
- API gateway host: for example `instance-tenant.apis.medallia.com` (regional `.eu`, `.au`, `.ca` hosts work too)
- Client ID and client secret

Credentials are separate per environment (production, sandbox, dev); add one account per environment. There is no redirect URI because no browser flow is used. The package exchanges the credentials for a one-hour bearer token and refreshes it as needed. Hosts are restricted to `medallia.com`, `.eu`, `.au` and `.ca`.

**Known gaps:** the Conversations (channel adapter) and Speech bulk-ingest APIs are not exposed. Async import and feed-file endpoints need to be enabled by your Medallia contact. Query API access depends on the client's role.
