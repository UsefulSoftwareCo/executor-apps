# Pneumatic

Pneumatic is a workflow management platform. This package covers templates (list, get, create), launching workflows from templates and reading their field data, completing tasks, listing tasks and users, file attachments, and webhook subscriptions.

**Interface:** hand-written tools over the REST API documented at https://api-docs.pneumatic.app/ (base URL `https://api.pneumatic.app`). Pneumatic publishes no OpenAPI document and no GraphQL or MCP server, so the tools follow the documented endpoints.

**Auth:** API key only. Create it on the Integrations page of your Pneumatic account (https://my.pneumatic.app/integrations). It is sent as `Authorization: Bearer <key>`. Pneumatic documents no OAuth for third-party apps.

**Known gaps:** only documented endpoints are covered; the vendor does not document workflow get/list/terminate or template update, so those are absent. The docs reference GET /workflows/:id (in the Launch a Workflow and Complete a task sections) but give it no section of its own, so it is not covered. The docs also disagree on the task-complete path (the HTTP Request section says <workflow-id>/task-complete, the code sample uses /workflows/<id>/task-complete); this package follows the code sample. Webhooks cover per-event subscribe/unsubscribe plus subscribe-all and unsubscribe-all. Request and response schemas are only partly documented, so most responses are returned as raw JSON. The docs have a few inconsistencies (kickoff choice fields take selection api_names or ids depending on the page); see the vendor docs.
