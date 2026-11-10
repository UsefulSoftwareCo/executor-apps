# JobNimbus

JobNimbus CRM for contractors: contacts, jobs, tasks, activities (notes), estimates, invoices, work orders, material orders, products, payments, budgets, file attachment metadata, account settings and users, units of measure, and the account configuration lists (workflows and statuses, lead sources, custom fields, file, task and activity types, locations).

**Interface:** hand-written tools over the official JobNimbus REST API (`https://app.jobnimbus.com/api1/`), documented in the vendor's Postman collection at https://documenter.getpostman.com/view/3919598/S11PpG4x. JobNimbus publishes no OpenAPI document and no MCP server. Each resource has `list`, `get`, `create`, `update` and `archive` where the API supports them. JobNimbus has no hard delete: `archive` sets `is_active` to false (the Postman collection's "Delete a ..." requests are `PUT` with `{"is_active": false}`). List tools take `size` (max 1000), `from`, `sort_field`, `sort_direction`, `fields` and an Elasticsearch-style `filter` in `query`; results are under `results`. All writes require approval.

**Auth:** API key. In JobNimbus open Settings, then API, then create a new API key (https://support.jobnimbus.com/how-do-i-create-an-integration-using-jobnimbuss-open-api). It is sent as a bearer token to `app.jobnimbus.com`. API access depends on the JobNimbus plan (the specific tier is not stated in the vendor docs). The vendor describes the key as an admin-level token whose permissions follow the Access Profile attached to the token; the optional `actor` query parameter makes a request inherit a specific team member's permissions and sets the record's Created By to that user. JobNimbus offers no OAuth to customers.

**Known gaps:** file uploads (separate `api.jobnimbus.com/files/v1` presigned-upload host, plus deprecated file creation) and file download are not wrapped; payments are listed at `/api1/payments` and created at `POST /api2/v2/payments`, both as published in the Postman collection; the optional `actor` query parameter is not exposed as a field but can be passed inside `query`. Request and response bodies are free-form JSON following the Postman reference.


The health check reads `GET /api1/account/users` (read-only); other tooling verifies against `/api1/contacts`, either works.
