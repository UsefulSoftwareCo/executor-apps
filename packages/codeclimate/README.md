# Code Climate

Code Climate's code quality platform, now operated as Qlty. Covers the current Qlty API: workspaces, projects, issues, project and file metrics (and series), builds and build logs, file coverage, components and applications, plus the user profile and rate limit.

Interface: OpenAPI, the vendor's own document at https://api.qlty.sh/openapi.json (docs: https://docs.qlty.sh/api/introduction). Legacy `api.codeclimate.com/v1` documentation has been retired and now redirects to Qlty, so it is not covered.

Auth: API token (Bearer). Create one at https://qlty.sh/user/settings/tokens. The API offers no OAuth for third-party apps.

Known gaps: the Qlty API is in early access and may change; legacy Code Climate v1 tokens (`Token token=`) and self-hosted Code Climate hosts are not supported. Mutations (components, applications, project updates) require approval.
