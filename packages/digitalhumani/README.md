# Digital Humani

Digital Humani's "Reforestation as a Service" API: list reforestation projects, request that trees be planted, and read tree counts per user, month, date range or enterprise.

## Interface

Hand-written tools (10, one per documented endpoint) over the REST API described at https://docs.digitalhumani.com/. Digital Humani publishes no OpenAPI document and no MCP server. Planting trees is the only mutation and always requires approval.

## Auth

Two API-key methods, both sent as the `X-Api-Key` header:

- Production API key: registered at https://my.digitalhumani.com/register, then the Developer page. Trees cost $1 each, invoiced monthly by the reforestation organization.
- Sandbox API key: from https://my.sandbox.digitalhumani.com (Developer page). Sandbox trees are free. Sandbox and production keys differ, and the key's method selects `api.sandbox.digitalhumani.com` or `api.digitalhumani.com`.

The same Developer page shows your `enterpriseId`, which several tools take; `whoami` also returns it. The API has no OAuth.

## Known gaps

None known; every endpoint in the public docs is covered.
