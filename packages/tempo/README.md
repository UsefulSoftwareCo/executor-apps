# Tempo

Tempo (Jira time tracking and planning): worklogs, accounts, customers, teams, plans, flex plans, timesheet approvals, periods, holidays, work attributes, webhooks and audit events.

**Interface:** OpenAPI, Tempo's official v4 document at https://apidocs.tempo.io/tempo-openapi.yaml, served from `https://api.tempo.io`. Mutations require approval.

**Auth:** API token (Bearer). In Tempo go to Settings, Data Access, API integration and create a token. Tempo also offers OAuth 2.0 (authorize `https://api.tempo.io/oauth/authorize/redirect`, token `https://api.tempo.io/oauth/token/`, no PKCE, with a `jira_url` authorization parameter set to the customer's Jira site, e.g. `https://<site>.atlassian.net`). It is not exposed: Executor's `authorizationParams` is fixed per provider and cannot vary per account, so the per-instance `jira_url` cannot be supplied. Tempo's docs state that `jira_url` is required for its OAuth redirect, so a static value would not work for other users.

**Gaps:** 16 operations are skipped as `schema_reference` (the compiler could not resolve their schema references in the published document); they are absent from the 238 tools. The universal host `api.tempo.io` is used; the regional hosts (`api.eu.tempo.io`, `api.us.tempo.io`) are not mounted. Operations on other origins, if any, are skipped.
