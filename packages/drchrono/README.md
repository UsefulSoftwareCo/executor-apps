# DrChrono

Covers the DrChrono EHR and practice management API (v4): patients, appointments, clinical notes, medications, problems, allergies, billing, claims, labs, messages, tasks, offices, doctors and settings.

Interface: OpenAPI 3, DrChrono's own document at https://app.drchrono.com/openapi-schema (the spec behind https://app.drchrono.com/api-docs/), served from `https://app.drchrono.com`. Every mutation requires approval.

Auth: OAuth 2.0 authorization code only; DrChrono issues no API keys. Register an application at https://app.drchrono.com/api-management/ and add Executor's redirect URI to it, then enter the client ID and secret on the connect page. Endpoints: authorize `https://app.drchrono.com/o/authorize/`, token `https://app.drchrono.com/o/token/` (form-encoded, client_secret_post). Scopes are the 22 documented ones (`patients:read`, `clinical:write`, `billing:read`, ...), space-separated. Access tokens expire after 48 hours and refresh via refresh_token.

The health check calls `GET /api/users/current`.

Icon: the official DrChrono "dr" app icon (160px PNG) from drchrono.com, as no SVG is published.

Known gaps: PHI is sent to whatever agent runs these tools, so use only under an appropriate BAA. Webhooks are not part of this package.
