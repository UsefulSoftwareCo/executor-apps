# ConnectSecure

ConnectSecure (formerly CyberCNS) vulnerability, patch and compliance management for MSPs. The package exposes 363 tools over the V4 API, grouped by area: companies, agents, credentials, assets, asset data, vulnerabilities, firewall, integrations, tags, reports and report queries, compliance, Active Directory, attack surface, external scans, EDR, backup software, PII, scheduler, jobs, patch management and users. Reads (`/r`) are queries; writes (`/w`) and deletes (`/d`) are mutations and always ask for approval.

**Interface:** hand-written tools generated from ConnectSecure's own Swagger document for the V4 API. ConnectSecure serves that document only from each tenant's pod (portal: Profile > API Documentation) and publishes no public OpenAPI URL, so the operation list in `operations.ts` was generated from a copy of that document kept at https://github.com/redanthrax/connectsecure-node/blob/HEAD/docs/swagger.yaml (a community repository, MIT licensed; the paths, methods and summaries are the vendor's). Request and response bodies are passed through as JSON, so use the portal's Swagger page for field-level schemas. List tools take `condition` (SQL-like filter), `skip`, `limit` and `order_by`.

**Auth:** API key only (ConnectSecure has no OAuth). Connect with:

- Pod host, for example `pod123.myconnectsecure.com` (the host shown on Profile > API Documentation, not `portal.myconnectsecure.com`).
- Tenant: the name you use to log in to the portal.
- Client ID and client secret: Global > Settings > Users, the three-dot menu on a user, API Key. The secret is shown once.

Executor sends `POST /w/authorize` with the `Client-Auth-Token` header (base64 of `tenant+clientId:clientSecret`), receives a bearer token and user id (valid up to two hours), and sends them as `Authorization` and `X-USER-ID` on every call; it re-authorizes automatically on a 401. Rate limits are 300 requests per minute, 2,000 per hour and 30,000 per day.

**Known gaps:** no typed request bodies or response schemas (pass `body` and `query` as JSON); endpoints added to ConnectSecure after the Swagger copy was taken are missing.
