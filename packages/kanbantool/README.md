# Kanban Tool

Kanban Tool visual project management: boards, tasks (search, create, update, move, archive, delete), subtasks, comments, time trackers, attachments (detach only), board changelogs and users.

**Interface:** custom, hand-written tools over the Kanban Tool REST API v3 (`https://<domain>.kanbantool.com/api/v3`, docs at https://kanbantool.com/developer/api-v3). Kanban Tool publishes no OpenAPI document, GraphQL API or official MCP server, so 24 endpoints are declared by hand. Reads are queries; every mutation requires approval.

**Auth:** API token only. In Kanban Tool open My profile > API access and click "Enable API access" to get the token. Enter the account domain (the `acme` in `acme.kanbantool.com`) and the token; the app sends it as `Authorization: Bearer <token>` to that host only. Kanban Tool has no user-created OAuth apps.

**Known gaps:**
- File uploads (`POST /attachments.json`, multipart) and pin/cover modes are not supported; attachments can only be detached.
- Task, board and user ids are numeric. Tools return the API's JSON as is.
- The vendor's docs disagree on whether writes are flat JSON or wrapped as `task[...]`; this package sends flat JSON, as in the docs' cURL examples, for tasks (`POST /tasks`, `PATCH /tasks/{id}`), subtasks and time trackers. The time tracker PUT section hints the server may expect a `time_tracker[...]` wrapper, so a 400 "no time_tracker parameter" (or similar for tasks/subtasks) means the wrapper is required. No second write format is implemented. This is untested against a live account.
- The vendor publishes no OpenAPI or MCP server on its developer page; a web search for one could not be run (search budget exhausted), so this is unverified elsewhere.
