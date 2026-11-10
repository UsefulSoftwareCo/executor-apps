# Paylocity

Paylocity WebLink API for Paylocity Payroll/HR: employees (list, get, create, update, onboarding), earnings, deductions, local and state taxes, direct deposit, emergency contacts, benefit setup, additional rates, sensitive data, pay statements, company codes and custom fields. 35 tools in 7 groups (employees, earnings, deductions, directDeposit, taxes, payStatements, company), all with `companyId` filled from the account.

Interface: custom (hand-written tools over `fetch`). Paylocity publishes no public OpenAPI file: the only OpenAPI document is the authenticated "Get Company-Specific Open API Documentation" endpoint, which needs real credentials. The operation list in `operations.ts` follows the [WebLink API reference](https://developer.paylocity.com/integrations/reference/weblink-api) (each method and path was checked against the OpenAPI definition on its reference page; most are `/api/v2/companies/{companyId}/...`, but deductions (get, list, delete), `updateLocalTax` and onboarding are `/api/v1`, and `upsertDeduction` is the non-company-scoped `POST /api/v1/deduction` taking the employee id or SSN in the body). Request and response bodies are passed through as JSON. Every create, update, upsert and delete tool requires approval.

Auth: WebLink client credentials (OAuth 2.0 `client_credentials`, no browser redirect and no redirect URI). Paylocity issues the client id and secret to approved customers and partners through the [Developer Portal](https://developer.paylocity.com/integrations/docs/getting-started); secrets must be rotated every 365 days. Connect with:

- Environment: `api` for production or `dc1demogw` for the sandbox.
- Company ID: your Paylocity company id.
- Client ID and client secret.

The token is requested from `https://<environment>.paylocity.com/IdentityServer/connect/token` with Basic client authentication and scope `WebLinkAPI`, then cached. The vendor's WebLink specs name `https://api.paylocity.com/IdentityServer/connect/token` as the token URL (production) and do not give a sandbox token URL; the sandbox request goes to `https://dc1demogw.paylocity.com/IdentityServer/connect/token`. If your sandbox rejects it, use a production-host token only with production credentials.

The account health check mints a token and lists one employee, so the client needs the employees resource granted; a 403 there means that grant is missing, not that the credentials are wrong.

Known gaps: the NextGen APIs (Employee Demographics v2, Pay Setup, Punch Detail, Scheduling, Cost Centers, Pay Entry v2) use a different token endpoint (`https://dc1prodgwext.paylocity.com/public/security/v1/token`) and credentials, and are not included. The partner-restricted APIs are not included. The closed-beta search endpoints (pay rates, employee statuses) are not included. Use `company.getCompanyOpenApi` on a live account to see your company-specific schemas.
