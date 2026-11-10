# Workiz

Field service management in Workiz: jobs, leads, team members, time off and job payments. 20 tools (12 mutations, each requiring approval), generated from Workiz's official v1 OpenAPI document at https://developer.workiz.com/api.json (the file behind the Swagger UI at https://developer.workiz.com/).

## Authentication

API token and API secret (`apiKey`). Workiz v1 has no OAuth. Turn on the Developer API add-on in the Feature Center, then open Settings > Integrations > Developer (v1 tab) and generate credentials. Requesting new credentials invalidates the old ones. The token is sent as a path segment (`https://api.workiz.com/api/v1/{token}/...`) and the secret is added to POST bodies as `auth_secret`; callers do not pass either. The connection check calls `team/all`.

## Known gaps

- Only the v1 API is covered. Workiz has since published a v2 API (clients, invoices, estimates, tags, webhooks) whose documentation is shown inside the account's Developer settings and is not public, so it is not included.
- The official document has no security scheme, so the token and secret are injected by the package rather than by the generic OpenAPI credential binding. It reuses the operationId `getJob` for both `/job/get` and `/lead/get`; the generated names stay distinct.
