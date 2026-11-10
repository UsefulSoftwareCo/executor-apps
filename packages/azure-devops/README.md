# Azure DevOps

Azure DevOps Services (dev.azure.com): organizations and projects, work items (WIQL queries, create, update, comments, iterations), Git repositories (branches, commits, files, pull requests and review threads), pipelines and builds (list, run, queue, timelines), and wikis. 40 hand-written tools over the REST API 7.1; mutations require approval.

## Interface

Hand-written tools calling `https://dev.azure.com/{organization}/{project}/_apis/...` (version 7.1). Microsoft's OpenAPI repository (MicrosoftDocs/vsts-rest-api-specs) is no longer public, so there is no official spec to compile. The official remote MCP server (`https://mcp.dev.azure.com/{organization}`) was probed: it accepts Entra OAuth only, with no dynamic client registration, so it cannot serve personal access tokens and was not used. API reference: https://learn.microsoft.com/rest/api/azure/devops/

## Auth

- **Personal access token** (`apiKey`): enter the organization name (the `myorg` in `dev.azure.com/myorg`) and a PAT. Create one at `https://dev.azure.com/<org>/_usersSettings/tokens` with scopes for what you use (Work Items, Code, Build, Wiki, Project and Team). Sent as HTTP Basic with an empty user name.
- **OAuth** (`oauth`): Microsoft Entra v2 with the `499b84ac-1321-427f-aa17-267ca6975798/user_impersonation` scope. Register an app in Entra (multi-tenant, with a web redirect URI equal to the redirect URI shown on Executor's connect page), add the Azure DevOps `user_impersonation` delegated permission, and enter its client ID and secret. OAuth accounts are not bound to one organization: pass `organization` on each call, found with `organizations.listOrganizations`.

## Known gaps

- Only `dev.azure.com` organizations; legacy `*.visualstudio.com` URLs are not addressed.
- No test plans, release pipelines (vsrm), artifacts, search, Advanced Security, or identity/permission APIs.
- Pull request and work item bodies for `updatePullRequest` are passed through as JSON.
