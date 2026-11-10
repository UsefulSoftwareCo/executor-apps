# Rentman

Rentman is equipment-rental and crew-planning software. This package exposes its public REST API: projects, subprojects, contacts, crew, equipment, planning, appointments, invoices, files and more (314 tools, 89 of them mutations, which require approval).

Interface: OpenAPI 1.16.0, the official document linked from the API docs at https://api.rentman.net (hosted on Rentman's documentation bucket). All calls go to `https://api.rentman.net`.

Auth: API token (`apiKey`). In Rentman, open Configuration > Account > Integrations, connect the "API" field and click "Show token". The token is sent as `Authorization: Bearer <token>`. Access follows the role of the user who generated the token. Regenerating the token invalidates the old one. Rentman does not offer user-created OAuth apps for the public API.

Known gaps: webhooks are configured in Rentman's settings and are not exposed as tools. Rentman enforces a daily request budget and rate limits. The health check requests one crew record: a 401 reports the token as invalid, while a 403 (role cannot read crew) still counts as healthy because the token authenticated. Rentman has no current-user endpoint and no resource is documented as readable by every role.
