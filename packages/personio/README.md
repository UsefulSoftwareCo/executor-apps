# Personio

Personio HR: persons and employments, absences, attendances and projects, org units, cost centers, workplaces, documents, payroll integrations, recruiting and jobs, reports and webhooks, through the Personio public API v2 (74 tools).

**Interface.** OpenAPI. Personio publishes v2 as one official OpenAPI file per area, indexed at https://developer.personio.de/openapi (for example `https://developer.personio.de/openapi/persons-service-api-v2.yaml`). The package mounts all 17 files under their own keys (`persons`, `absencePeriodApi`, `recruitingService`, ...) in one router. Every mutation asks for approval.

**Auth.** One method, the client credentials grant:

- `machine`: a `client_id` and `client_secret` created in Personio (see Personio's help article "Generate and manage API credentials", https://support.personio.de/hc/en-us/articles/4404623630993, for the current menu path and the permissions required). The connect page exchanges them at `https://api.personio.de/v2/auth/token`; there is no redirect URI. The scopes (persons, absences, recruiting, webhooks, ...) are set on the credential in Personio, and the token request leaves `scope` out so the token gets all of them. Tokens last one day and Executor renews them.

**Known gaps.**

- v2 is the target. The legacy v1 API (partner and app id headers, `/v1/auth`) and the Recruiting XML job feed are not covered.
- Several published documents reference JSON Pointers inside other operations, which Executor cannot follow. `openapi.ts` patches those references (free-form objects for response schemas, inlined copies for shared parameters), so a few response shapes are looser than Personio's documents. All 74 operations compile.
- v2 has no "current user" endpoint, so the account health check lists one person and needs the persons read scope; a credential without it shows as unhealthy although other areas work.
- `scripts/tools.ts` only counts the persons area (`options`); the other areas are in `areas`.
