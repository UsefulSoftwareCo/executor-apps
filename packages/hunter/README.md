# Hunter

Find and verify professional email addresses with Hunter: domain search, email finder and verifier, people and company enrichment, leads and lead lists, campaigns, sequences, email accounts, tags and webhooks.

Interface: OpenAPI, Hunter's official document at https://hunter.io/openapi.json (API base `https://api.hunter.io/v2`). Mutations require approval.

## Auth

API key. Create one in Hunter under API at https://hunter.io/api-keys. It is sent in the `X-API-KEY` header. Hunter's API has no user-created OAuth apps, so none is offered.

## Known gaps

The spec documents both `/leads-lists` and legacy `/leads_lists` paths; both are exposed. The spec URL redirects from api.hunter.io to hunter.io.
