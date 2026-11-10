# BugBug

Manage and run BugBug browser tests from Executor: tests, suites, test and suite runs, steps, step groups, reusable components, folders, tags, import/export, project settings and visual regression references (95 tools, 48 of them mutations that require approval).

Interface: OpenAPI, BugBug's official public API v2 document at https://app.bugbug.io/docs/schema/?version=v2 (the spec declares no server, so the package sets `https://app.bugbug.io` as the base URL; docs at https://docs.bugbug.io/integrations/public-api).

Auth: project API token (`apiKey`), sent as `Authorization: Token <token>`. In BugBug open Integrations, then the API tab, and copy the project API token. The token belongs to one project, so add one account per project. Public API access requires a paid BugBug plan. BugBug offers no user-created OAuth apps.

Health check: `GET /api/v2/tests/` (the `/config/status/` probe never rejects a bad token).

Known gaps: none known; all operations in the spec are exposed.
