# ONLOGIST

Vehicle transfer ordering on [ONLOGIST](https://www.onlogist.com): create and manage transfer orders, accept or reject price offers, message the service provider, manage locations and cost centers, read changes, qualifications and multi invoices.

Interface: hand-written tools over the official Transportation REST API, documented as RAML 1.0 at https://dev.portal.onlogist.com/api/v1/transportation/doc (Swagger UI at `/doc/ui`). ONLOGIST publishes no OpenAPI document, so the 30 JSON endpoints are declared in `operations.ts`. The production spec at https://portal.onlogist.com/api/v1/transportation/doc has base URI `https://portal.onlogist.com/api/{version}/transportation`; the sandbox spec at `dev.portal.onlogist.com` is identical apart from the host. The package defaults to production and sends credentials only to the host chosen by the account's `environment` field (`production` or `sandbox`).
Auth: API key (`apiKey`), sent as the raw `Authorization` header with no `Bearer` prefix. Request a key through your ONLOGIST account or via the Developer Portal (https://www.onlogist.com/en/solutions/simple-system-integration/access-via-interface). Leave the optional `environment` field empty for production, or set it to `sandbox` for a developer-portal key. No OAuth is offered.

Health check lists qualifications, as the API has no current-user endpoint.

Known gaps: multipart and binary endpoints (take over and hand over report upload and download, receipt attachment download, protocol images) are not exposed.
