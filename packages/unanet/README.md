# Unanet

Unanet CRM (formerly Cosential, API name "Compass"): projects and their sub-resources, companies, contacts, opportunities, activities and views. The package mounts both official OpenAPI documents published at https://compass.cosential.com/documentation: `compass` (v1, https://compass.cosential.com/Content/compass-openapi.json, 109 operations) and `crm` (v2, https://compass.cosential.com/v2/swagger/v2/swagger.json, 97 operations). Every mutation asks for approval.

## Auth

One method, "Firm ID, API key and user login". Enter the firm ID and API key issued for your firm (sign up or request them at https://compass.cosential.com/home/start) and the username and password of a Unanet CRM user. This follows the flow the documentation page (https://compass.cosential.com/documentation) calls recommended:

1. `POST /v2/api/token/auth` with `{ FirmId, Username, Password }` returns an access `Token` and a `Refresh` token.
2. Every request then carries `Authorization: Bearer <Token>` and `x-compass-api-key` (the v1 document requires both). `x-compass-firm-id` is sent too: it is not in the documents' securitySchemes, but the documentation page uses it in its request examples.
3. On a 401 the token is renewed with `POST /v2/api/token/auth/refresh`, falling back to a new login.

The token is held in memory only. The password is only ever sent to compass.cosential.com. The health check logs in and reads `GET /v2/api/rest/currencies`. Basic auth and the `x-compass-token` header are marked deprecated on the documentation page and in the v1 document, so they are not offered.

## Known gaps

- No live firm was available, so the full login, Bearer call and refresh path has not been run against a real account. Checked against the live service without credentials: the token endpoint answers 401 for bad credentials and accepts the firm ID as a decimal string; `/v2/api/rest/currencies` answers 401 without credentials.
- The documentation page shows the refresh response as `{ AuthResponse: { token, refresh } }`, unlike the login response; both shapes are read, and any failure falls back to a new login.
- The v2 document names response schemas like `QueryResponse[...]`, which the compiler cannot resolve (it supports only `#/components/schemas/<name>` references). `openapi.ts` therefore removes those response bodies with about 170 exact-path JSON patches: the affected tools lose their output types, and the patches are brittle, since a path that disappears upstream makes the `crm` mount fail to compile. JSON patches have no wildcards, so a narrower patch is not possible. One operation (`projectGrid.filterProjects`) is skipped because its request body references such a schema.
- `scripts/check.sh` counts only the first exported spec (v1, 109 tools). The `crm` mount (97 tools, 43 mutations) was compiled separately with `openapiToolNames`; total 206 tools, 115 mutations.
