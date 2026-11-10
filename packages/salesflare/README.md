# Salesflare

Salesflare CRM: accounts, contacts, opportunities, tasks, workflows, tags, custom fields, users and more (71 tools, 37 of them mutations that require approval).

Interface: Salesflare's official Swagger 2.0 document at https://api.salesflare.com/openapi.json, compiled live against https://api.salesflare.com. The document declares no security schemes, so the package applies a bearer scheme to every operation.

Auth: API key only. Create one in Salesflare under Settings > API keys (https://app.salesflare.com/#/settings/apikeys) and paste it; it is sent as `Authorization: Bearer <key>`. Salesflare offers OAuth only to registered partners, so no OAuth method is declared.

Known gaps: the health check only confirms the key authenticates against `GET /me`. This package covers all 46 documented paths.
