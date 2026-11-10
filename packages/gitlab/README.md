# GitLab

Projects, merge requests, issues, pipelines and jobs, repositories and files, branches, commits, groups, members, runners, packages, deploy keys, users and the rest of the GitLab.com REST API (v4): 1867 tools, 1036 of them mutations (each requires approval).

Interface: OpenAPI, GitLab's own generated OpenAPI 3.0 document at https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/api/openapi/openapi_v3.yaml (the one integrations.sh lists for the GitLab REST API). It declares http bearer, oauth2 and `PRIVATE-TOKEN` apiKey auth; the package sends the token as `PRIVATE-TOKEN` and OAuth access tokens as bearer. GitLab also publishes a Swagger 2.0 document (`openapi_v2.yaml`) with 1151 operations; the v3 document has 1867 (about 60% more), so v3 is used. It compiles with 0 skipped operations.

## Auth

- **Access token** (`token`): a personal, project or group access token created at https://gitlab.com/-/user_settings/personal_access_tokens (project/group tokens under Settings > Access tokens). Use the `api` scope for full access, or `read_api` for read-only use. Sent as the `PRIVATE-TOKEN` header.
- **OAuth 2.0** (`oauth`): create an application at https://gitlab.com/-/user_settings/applications (or a group/instance application), tick "Confidential", set the redirect URI to the one shown on Executor's connect page, and enter the application's id and secret there. Scopes requested: `api read_user`. `api` already covers `read_user`; the latter is listed explicitly so the profile endpoint used by the health check stays available if the scope is ever narrowed. GitLab rotates the refresh token on every refresh (access tokens last 2 hours); Executor stores the newly issued refresh token each time.

## Known gaps

- Only GitLab.com is supported. Self-managed instances need a different host, which the package does not accept.
- GraphQL-only features and the experimental `glab` MCP server are not covered.
