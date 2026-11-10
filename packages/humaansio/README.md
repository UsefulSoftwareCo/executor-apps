# Humaans

Humaans is an HR platform. This package covers its public REST API: people, job roles, companies, spaces and locations, compensation and bank accounts, emergency contacts, org units, the job library, working patterns, time away (types, policies, allocations, adjustments), timesheets, public holidays, documents and identity documents, equipment, performance cycles and reviews, custom fields and values, data exports and webhooks (about 166 tools).

Interface: hand-written tools over `https://app.humaans.io/api`, following the official API reference at https://docs.humaans.io/api/. Humaans publishes no OpenAPI document, so the tools are a table of the documented resources and verbs. List tools take `limit`/`skip` (`$limit` up to 250, `$skip`) and a `query` object for filters; create and update tools take a `body`. All mutations require approval.

## Auth

- API access token (`apiKey`): create one in Humaans under Settings > Integrations > API access tokens (https://docs.humaans.io/api/#authentication). It is sent as `Authorization: Bearer <token>`. Choose scopes (`public:read`, `private:read`, `private:write`, `compensations:read/write`, `documents:read/write`) to match the tools you need.

Humaans has no OAuth for customer-created apps, so there is no OAuth method.

## Known gaps

- File upload (`POST /files` is multipart) is not usable: `files.create` sends JSON only. `files.get` returns metadata and a download URL.
- Requests are rate limited per token (burst of 40, refill about 7 per second).
