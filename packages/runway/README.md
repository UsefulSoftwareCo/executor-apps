# Runway

Generate and transform video, images, speech and sound effects with Runway, and manage tasks, uploads, avatars, documents, routers and organization usage.

Interface: OpenAPI, from Runway's official document at https://docs.dev.runwayml.com/openapi.json (API host `https://api.dev.runwayml.com`). The required `X-Runway-Version` header is sent automatically as `2024-11-06` and is not a tool input.

Auth: API secret (`apiKey`). Create one in the Runway developer portal at https://dev.runwayml.com. Runway's API supports only API keys, so there is no OAuth. Generation endpoints spend credits, so every mutation requires approval.

Known gaps:
- `POST /v1/uploads` returns a presigned `uploadUrl` and `fields` that require sending the file bytes to an external storage host, which these OpenAPI tools cannot do. Pass publicly reachable URLs (or data URIs where the API accepts them) to generation endpoints instead. The upload host is intentionally not in `hosts`, because no credential is sent there.
- `GET /v1/organization/webapp/usage`, `GET /v1/organization/webapp/audit_logs` and `GET /v1/organization/webapp/audit_logs/{eventId}` are documented as authorized through an account link between the API project and a Runway workspace, so they may fail with a plain API key. They are still exposed.
- Generation tasks are asynchronous, so poll the task endpoint for results.
