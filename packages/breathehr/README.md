# Breathe HR

Breathe HR is UK HR software for small businesses. This package covers employees, leave requests and approvals, absences, sickness, expenses and expense claims, training courses, salaries, benefits, bonuses, jobs, departments, divisions, locations, working patterns, holiday allowances, projects, documents and change requests: 50 tools.

## Interface

Hand-written tools over the Breathe HR REST API (`https://api.breathehr.com/v1`, sandbox `https://api.sandbox.breathehr.info/v1`), documented at https://developer.breathehr.com. Breathe publishes no OpenAPI document and no MCP server. Filters go in a tool's `query` input and write fields in `body`; the tool adds the root key Breathe expects (`{"employee": {...}}`). Lists are paginated with `page` and `per_page` (default 25, max 100); the total and next-page links are returned with the data. Every write asks for approval.

## Auth

API key only; Breathe has no OAuth. Turn the API on in Breathe and copy the key from `/account/api_setup`. Keys are per environment, so there are two methods: "Production API key" (keys starting `prod-`; the vendor page text is garbled and ambiguous, so the pattern `^(prod|sandbox)-\S+$` was used) and "Sandbox API key" (keys starting `sandbox-`). The key is sent in the `X-API-KEY` header. Health check: `GET /account`.

## Known gaps

- Breathe's developer site did not expose a machine-readable endpoint list, so the tool set follows the documented authentication, environment and pagination pages; request bodies for create and update tools are free-form objects.
- File upload and download endpoints, if any, are not covered.
