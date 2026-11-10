# Codegen

Run and manage [Codegen](https://codegen.com) AI software engineering agents: create, resume and list agent runs, read agent traces, list organizations, users and repositories, edit pull requests, and manage check-suite settings.

**Interface:** OpenAPI 3.1 document published by Codegen with its API docs, <https://docs.codegen.com/api-reference/openapi3.json> (server `https://api.codegen.com`). The document declares no security schemes; the package applies a Bearer token.

**Auth:** API token. Create it at <https://codegen.com/token> (the same page shows your organization ID, which most operations take as `org_id`). Sent as `Authorization: Bearer <token>`. Codegen has no user-created OAuth apps, so there is no OAuth method. Every mutation requires approval.

**Known gaps:** the image-upload variant of Create Agent Run and Slack connect-token flows follow whatever the spec describes; rate limits are 60 requests per 30 seconds (10 per minute for agent creation).
