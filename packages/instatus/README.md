# Instatus

Manage Instatus status pages: pages, components, incidents and incident updates, maintenances, templates, teammates, subscribers, metrics, uptime and cron monitors, monitor alerts and groups, routing rules, escalation policies, on-call schedules and workspaces.

**Interface:** OpenAPI. Instatus's official specification (OpenAPI 3.0.3, published by the `instatushq` GitHub organization): https://raw.githubusercontent.com/instatushq/openapi/main/instatus.json. All operations are served from `https://api.instatus.com`.

**Auth:** API key. Create one in the Instatus dashboard under Developer (https://dashboard.instatus.com/developer) and paste it when connecting. It is sent as `Authorization: Bearer <key>`. The vendor documents only API keys; no OAuth method is documented, so none is offered.

**Approvals:** every mutating operation (create, update, delete, and the cron monitor ping endpoints, including the GET and HEAD ones, which record check-ins) asks for approval.

**Known gaps:** the spec's `/summary.json` operation (`publicData.getSummaryJson`) is the per-status-page public summary, which lives on each page's own domain rather than `api.instatus.com`. It is exposed because the package cannot exclude single operations, but it will fail against the API host.
