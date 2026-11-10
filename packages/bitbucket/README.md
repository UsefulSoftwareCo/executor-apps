# Bitbucket

Bitbucket Cloud: repositories, branches, commits, pull requests and reviews, issues, Pipelines, deployments, snippets, workspaces, projects, users, SSH keys and webhooks.

**Interface:** OpenAPI. Atlassian's official Swagger 2.0 description of the REST API 2.0, https://api.bitbucket.org/swagger.json (294 tools, 137 mutations; mutations always ask for approval).

**Auth**

- API token (`apiToken`): the Atlassian account email (not the Bitbucket username) and an API token, sent as HTTP Basic. Create the token under Account settings > Security > Create and manage API tokens and choose its scopes then; see https://support.atlassian.com/bitbucket-cloud/docs/api-tokens/. The health check reads `/2.0/user`, which needs the `read:user:bitbucket` scope. Bitbucket also accepts the token as a Bearer header (added Aug 2026), but Basic is used here. App passwords were deprecated by Atlassian (July 2026) and are not supported.
- Access token (`accessToken`): a repository, project or workspace access token, sent as a Bearer token. Create it under the repository/project/workspace settings > Access tokens. Give it a label to tell it apart. These tokens cannot read `/user`, so the health check uses the workspaces endpoint with Bearer; that this returns 200 for a repository-scoped token is untested. Bitbucket returns no account id for these tokens, so the account identity is the label you give it; use distinct labels.
- OAuth 2.0 (`oauth`): create an OAuth consumer under Workspace settings > OAuth consumers and set its callback URL to the Executor OAuth redirect URI shown on the connect page. Authorization `https://bitbucket.org/site/oauth2/authorize`, token `https://bitbucket.org/site/oauth2/access_token` (client secret via HTTP Basic). Scopes cover account, email, repository, pull request, issue, pipeline, project, snippet, webhook and wiki; no admin or delete scopes are requested.

**Known gaps:** the access token health check is unverified against a live token (no real accounts were connected). Nothing was skipped by the generator.
