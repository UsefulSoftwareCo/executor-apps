# quipteams

Covers quipteams, the global IT asset management service: quotes, assets,
device actions (store, assign, reassign, sell, support), products, kits,
scheduling links, employees, offices and webhook endpoints (26 tools).

Interface: hand-written tools over the official REST API v1 at
`https://api.quipteams.com`. quipteams publishes API reference pages and a
Postman collection (`https://api.quipteams.com/quipteams-api-v1.postman_collection.json`)
but no OpenAPI document, so the tools follow the documented endpoints. Every
mutation asks for approval.

Auth: API key (sent as `Authorization: Bearer <key>`). Create one in your
company settings in quipteams; keys start with `qk_live_` and are shown once.
There is no OAuth.

Known gaps: responses are returned as untyped JSON; list endpoints use cursor
pagination (`limit`, `cursor`) which callers must follow themselves. Nothing was
called with a real key while building this.
