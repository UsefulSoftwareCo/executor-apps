# Workpath

Covers the Workpath Connect API v3: goals and key results (with updates), KPIs (values, actuals, targets, forecasts), initiatives, strategic elements, cycles, notes, teams and users.

Interface: OpenAPI 3.1, the official document at https://connect.workpath.com/api/v3/openapi.json (reference: https://connect.workpath.com/api/v3/docs). Mutations require approval.

Auth: API client token (`apiKey`), sent as `Authorization: Bearer <token>`. A Workpath admin creates an API client under Settings > Integrations > API clients and copies its token. The Connect API offers no user-created OAuth apps.

Known gaps: none known; the webhook public-key endpoint is included as a plain read.
