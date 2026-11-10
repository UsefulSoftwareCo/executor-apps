# Jira

Jira Cloud issues, projects, JQL search, comments, worklogs, users, groups, workflows, fields, filters, dashboards, permissions and the rest of the Jira Cloud platform REST API (v3): 620 tools, 344 of them mutations (each requires approval).

Interface: OpenAPI, Atlassian's official Jira Cloud platform document at https://dac-static.atlassian.com/cloud/jira/platform/swagger-v3.v3.json. Jira Software (agile boards, sprints) and Jira Service Management have separate APIs that this document does not cover.

## Auth

- **API token** (`token`): site name (the `<site>` in `<site>.atlassian.net`), Atlassian account email, and an API token created at https://id.atlassian.com/manage-profile/security/api-tokens. Sent as Basic auth to the site.
- **OAuth 2.0 (3LO)** (`OAuth2`): create an app at https://developer.atlassian.com/console/myapps, add the OAuth 2.0 (3LO) authorization type, and set its callback URL to the redirect URI shown on Executor's connect page. Enter the app's client id and secret there. Default (classic) scopes: `offline_access read:jira-user read:jira-work write:jira-work manage:jira-project manage:jira-configuration`. Select the same classic scopes in the developer console under Permissions > Jira API. Tool-to-scope mapping: read tools need `read:jira-work` (users and groups need `read:jira-user`); issue, comment and worklog writes need `write:jira-work`; project create/update/delete needs `manage:jira-project`; admin and configuration tools (custom fields, workflows, schemes, screens, permissions, application roles) need `manage:jira-configuration`. Webhook management needs `manage:jira-webhook`, which is not requested by default; add it in the console and to the scope list if you need it. Granular scopes are only a fallback if classic scopes are unavailable for your app.

## Known gaps

- OAuth tokens only work through the Atlassian gateway (`api.atlassian.com/ex/jira/{cloudId}`), so every tool on an OAuth account takes a required `cloudId` path parameter. Get it from `https://api.atlassian.com/oauth/token/accessible-resources` (it is also the account's external id). API token accounts have no such parameter.
- 7 operations are skipped on the OAuth variant because the spec marks them Basic-auth only (`auth_method`): myself.setLocale, issueRedaction.redact, issueRedaction.getRedactionStatus, users.getUserEmail, users.getUserEmailBulk, workflowTransitionRules.deleteWorkflowTransitionRuleConfigurations and the internal worklog bulk operation. They remain available on API token accounts.
- Jira Software (boards, sprints, epics) is out of scope; its separate OpenAPI (https://dac-static.atlassian.com/cloud/jira/software/swagger.v3.json) could be a sibling `jira-software` package.
- The OAuth account's external id is the first accessible site id, not the user (`/me` needs `read:me`, not requested). Jira Data Center / Server is not covered.
