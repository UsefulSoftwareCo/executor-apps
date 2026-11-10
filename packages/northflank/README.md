# Northflank

Deploy and operate workloads on Northflank: projects, services, jobs, addons, pipelines, secrets, domains, volumes, backups and cloud integrations.

Interface: OpenAPI, Northflank's official description at https://api.northflank.com/v1/swagger-json (docs: https://northflank.com/docs/v1/api/use-the-api). The description declares no security schemes and a placeholder server, so the package supplies a bearer scheme and pins the origin to `https://api.northflank.com`. Every mutation requires approval.

Auth: API token (`apiKey`), sent as `Authorization: Bearer`. Create one in Northflank under Team settings, API, Tokens (or an account-level token in account settings), and grant it the roles/permissions the operations need. Northflank has no user-created OAuth apps, so there is no OAuth method. The health check calls `GET /v1/auth`.

Known gaps: the spec is large (about 500 paths); response schemas use Swagger 2 style `schema` keys, so some output types may be loosely typed.
