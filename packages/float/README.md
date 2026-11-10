# Float

Float resource planning: people, departments, roles, projects, phases, milestones, allocations (scheduled tasks), time off, public and team holidays, logged time, clients, currencies, rate cards, project templates, utilization reports and delete logs.

## Interface

Hand-written tools over the Float API v3 (`https://api.float.com/v3`), 101 in total. Float publishes an official Swagger 2.0 definition (https://developer.float.com/swagger-api-v3.yaml), but it is split across several files with external `$ref`s, which Executor's OpenAPI compiler does not support, so the tools are written by hand against the paths in that definition. List tools take `page`, `perPage`, `fields`, `sort` and per-resource filters, and return pagination totals from Float's response headers. Create and update tools take a `body` object with the fields documented at https://developer.float.com. Every mutation requires approval. Requests send the User-Agent Float requires.

## Auth

API key. Create an access token in Float under Account Settings, Integrations (https://developer.float.com/overview_authentication.html) and paste it as the API access token. Float exposes no user-created OAuth apps.

## Known gaps

- Create and update bodies are untyped objects rather than per-field schemas.
- The `project-tasks/merge` endpoint is not exposed.
- Float rate limits are per company: 200 GET and 100 non-GET requests per minute, 30 per minute for reports, plus bursts of at most 10 GET and 4 non-GET requests per second. Exceeding a limit returns HTTP 429.
- Report endpoints are not paginated and accept only `start_date`, `end_date` and one `people_id` / `project_id` filter.
- Write verbs were checked against Float's per-resource path files: project templates and public holidays are read-only (project templates also have a create-project-from-template tool), and time off types cannot be deleted. Only filters documented in those files are exposed.
- The User-Agent contact address `support@executor.sh` must be a monitored mailbox before shipping; this could not be verified here.
- No official Float MCP server was found.
