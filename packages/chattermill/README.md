# Chattermill

Customer feedback analytics: projects, responses (feedback with score, comment, metadata and themes), data sources and types, custom segments, themes, categories, attributes, tags and metrics such as NPS.

Interface: hand-written tools over Chattermill's official REST API (`https://api.chattermill.com/v1`), documented at https://apidocs.chattermill.com/ (a Postman documenter page generated from Chattermill's official Postman collection, the interface source). Chattermill publishes no OpenAPI document, so the 22 documented operations are written by hand. Mutations (create, update, delete, search) require approval.

Auth: API key. Create it in Chattermill under Settings > API (https://app.chattermill.com/settings/api); it is sent as `Authorization: Bearer <key>`. Chattermill's API does not offer OAuth.

Known gaps: Chattermill's separate Partner API (`api.chattermill.io/partner`, key issued by an account manager) is not covered. The package uses the documented API host `api.chattermill.com`. The health check only confirms the key can list projects.

Path note: the Postman collection lists the response update as `PUT https://api.chattermill.com/api/v1/:project/responses/:response_id`, while every other operation and the written guide (`PUT /responses/{id}`) use the `/v1` base. The code uses `/v1/:project/responses/:id`; an unauthenticated PUT cannot confirm which prefix is right (401 on `/v1`, 403 on `/api/v1`).
