# Gem

Gem is a recruiting platform. This package covers three official Gem APIs as one product, mounted under separate keys:

- `crm`: candidates, projects, sequences, custom fields, users and events (46 operations).
- `ats`: jobs, applications, candidates, scorecards, offers and more (42 operations). Requires Gem ATS on the account.
- `jobBoard`: public job posts, departments and offices, plus application submission (7 operations).

Interface: OpenAPI, from the official documents `https://api.gem.com/v0/openapi.json`,
`https://api.gem.com/ats/v0/openapi.json` and `https://api.gem.com/job_board/v0/openapi.json`. The specs declare no
servers, so the package sets `https://api.gem.com` as the base URL. All mutations require approval.

## Auth

API key only (Gem has no OAuth for customers). A team admin creates a 40-character key in Gem under Team Settings,
API; it is sent as the `X-API-Key` header. The `/v0/users` endpoint is used as the health check.

## Known gaps

- Gem integration partners also send an `X-Application-Secret` header. That is only issued to partners, so it is not supported.
- The Job Board spec declares no security scheme, so the API key is not attached to its application submission
  endpoint, which Gem documents as needing a team key. Public job board reads work without a key.
