# Leapsome

Leapsome people enablement platform. Two official APIs are mounted under separate keys:

- `content`: the Content API (26 tools): goals and key results, reviews and participants, employees, employments, access roles, absences, feedback and praise, payroll cycles, time-tracking timesheets, work locations and documents.
- `scim`: the SCIM 2.0 API (user and group provisioning, 11 tools).

Source: the OpenAPI documents Leapsome embeds in its own Swagger UI pages,
https://api.leapsome.com/v1/api-docs/ and https://api.leapsome.com/scim/v1/api-docs/. Leapsome publishes no
standalone spec URL, so both documents are bundled in this package (`content.json`, `scim.json`). The Content API's
`/token` operation is removed because the app performs that exchange itself.

## Auth

- API Secret (`apiSecret`, Content API): an admin creates it in Leapsome under Settings > Integrations and imports
  ("Content API access", Create API Secret). The app exchanges it for a short-lived JWT (`GET /v1/token?secret=...`),
  caches the JWT until shortly before it expires, and sends it as a Bearer token. Leapsome calls this a two-step token flow.
- SCIM token (`scimToken`, SCIM API): generated under Settings > Integrations and imports > HRIS integrations >
  SCIM. Sent as a Bearer token.

Leapsome offers no OAuth apps. Add one account per credential; each account exposes only the tools its credential authorizes.

## Gaps

SCIM is limited to 30 parallel requests per second. The Content API is mostly read-only; the write endpoints are goal
key-result and initiative updates, feedback, document upload and access-role assignment, all approval-gated.
