# Resource Planner

Resource Planner (resourceplanner.io) team scheduling: resources (people), projects, assignments (create, update, delete, filtered listing), time entries, and the vendor's availability, vacation, history and overview analysis tools.

**Interfaces:**
- REST, hand-written tools over the official API (`https://www.resourceplanner.io/api/...`, documented at https://www.resourceplanner.io/integration/api-access). Resource Planner publishes no OpenAPI document. 13 tools: list/create/update/delete for resources, projects and assignments, plus read-only time-entry listing. Update and delete take an `id`; filters go in `query` and request fields in `body`.
- The vendor's official remote MCP server (`https://www.resourceplanner.io/api/mcp`, documented at https://www.resourceplanner.io/integration/mcp-integration), mounted under `mcp`. 15 tools: rp_search, rp_list, rp_list_availability, rp_assign, rp_update_assignment, rp_delete_assignment, rp_get_team_time_entries, rp_get_team_running_timers, rp_vacations, rp_vacation_impact, rp_project_history, rp_project_people_changes, rp_weekly_overview, rp_notes_timeline, rp_long_runs.

All writes (REST mutations and MCP tools not marked read-only) require approval. The apex domain `resourceplanner.io` 308-redirects to `www.resourceplanner.io` and the redirect drops the Authorization header, so everything uses `www`.

**Auth:** two account methods, both bearer tokens sent to `www.resourceplanner.io`; one key per workspace. No OAuth is documented.
- REST API access key: Settings, API access for REST clients, Generate new key (shown once). Gives the REST tools.
- MCP key: Settings, MCP section, generate a key (shown once). Gives the `mcp` tools. Add an account of each kind to get both sets.

**Known gaps:** the MCP server also advertises OAuth metadata, but the vendor documents only keys, so OAuth is not offered. Webhooks and time-entry writes (app-only) are not covered. PUT/DELETE for resources and projects and time-entry listing exist only through REST, so they need a REST-key account. Icon is the vendor's official 512px app icon (`/icon-512x512.png`).
