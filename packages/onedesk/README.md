# OneDesk

Covers OneDesk's public REST API: tickets and tasks (items), projects, portfolios,
customers and customer organizations, users, teams, timesheets, timers,
conversations and messages, invoices, quotes, attachments, activities and
organization metadata.

Interface: OpenAPI 3.1 document published by OneDesk at
https://onedesk.com/public-api/onedesk-public-api.json (Swagger UI at
https://onedesk.com/public-api/swagger.html), served from https://app.onedesk.com.

Auth: API key only (OneDesk has no OAuth). The account owner creates an API user
in OneDesk under Administration > Integrations > API; the key is sent in the
`OD-Public-API-Key` header. API access is an Enterprise plan feature and each API
user counts as a paid license.

Known gaps: the "filter" operations are POST requests that only read data, but
they are classified as mutations and so require approval. Timer start/pause/
resume/cancel are GET requests in OneDesk's spec but change state, so they are
forced to mutations (and require approval) via the `kinds` option in `openapi.ts`.
Follow-up: if OneDesk confirms the filter POSTs are read-only, set them to "query"
through the same `kinds` option.

Spec note: OneDesk's published document nests each tag's schemas and references them
with paths Executor cannot resolve, so `spec.ts` is a copy of that document with the
schemas hoisted to `#/components/schemas/<tag>__<Name>`. Nothing else is changed.
Regenerate it with `node packages/onedesk/build-spec.mjs` when OneDesk updates the API.
