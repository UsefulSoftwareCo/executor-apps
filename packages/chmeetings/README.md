# ChMeetings

Church management through the ChMeetings API: people, families, groups, events and attendance, giving, accounting (accounts, categories, funds, payees, transactions) and organizations.

Interface: OpenAPI. The tools are generated from ChMeetings' official OpenAPI 3.1 document at https://api.chmeetings.com/openapi/v1.json (interactive docs at https://api.chmeetings.com/scalar/). Every mutation asks for approval.

## Auth

API key. A ChMeetings admin enables it under Settings > Integrations > API Integration > Get API, then copies the key. It is sent in the `apikey` header to `api.chmeetings.com`. The API has no OAuth. The rate limit is 100 requests per second.

## Known gaps

The API is only available to churches that have enabled it. The health check calls `GET /api/v1/organizations`, so a key without access to organizations is reported unhealthy.
