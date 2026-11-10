# iLert

Covers the iLert REST API: alerts, incidents, alert sources, escalation policies, on-call schedules, services and status pages, users and teams, connectors and more.

**Interface:** OpenAPI, loaded live from iLert's official document at https://api.ilert.com/api-docs/openapi.json (the document declares a relative `/api` server; the package pins `https://api.ilert.com/api`). Mutations require approval.

**Auth:** API key. Per the vendor's authentication page (https://docs.ilert.com/developer-docs/rest-api/api-reference/introduction/authentication.md), "each user may create API keys using the ilert web application"; the page gives no menu path. It is sent as `Authorization: Bearer <key>`. API keys do not apply the user's selected team context, so list results include everything the user may view. iLert has no user-created OAuth apps, so there is no OAuth option. The spec marks a few endpoints (`GET /numbers`, `GET /integrations`, `POST /events`, `POST /series/{key}`, `POST /deployment-events`) as `security: []`; the package still sends the key to them, which is harmless because they are on the same host.

**Icon:** iLert's own mark, from the vendor's official safari-pinned-tab SVG on ilert.com.

**Known gaps:** Only the `api.ilert.com` host is allowed; self-hosted or regional installations are not supported.
