# Everhour

Time tracking with Everhour: projects, sections, tasks, custom fields, time records, timers, timecards, timesheets and approvals, clients, invoices, expenses, resource planning (assignments, time off, allocations), reports and webhooks.

**Interface:** hand-written tools over Everhour's REST API (`https://api.everhour.com`). Everhour publishes its API only as an API Blueprint document on Apiary (https://everhour.docs.apiary.io), not OpenAPI, so the 101 operations in `routes.ts` were transcribed from that official document. Reads are queries; every POST/PUT/PATCH/DELETE is a mutation that requires approval. Mutations take their JSON payload in `body`.

**Auth:** API key only. Everhour offers no OAuth. Each user finds their key at the bottom of their profile page (https://app.everhour.com/#/account/profile). It is sent in the `X-Api-Key` header to `api.everhour.com`.

**Known gaps:**
- Attachment download (binary response) is not exposed.
- "Update Task Custom Fields" shares `PUT /tasks/{task_id}` with Update Task; pass the custom-field payload to `tasks.updateTask`.
- The API is rate limited to about 20 requests per 10 seconds per key (HTTP 429 with `Retry-After`).
