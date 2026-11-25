# GitCafe

Repositories, code, branches and tags, code search, issues, pull requests, diffs, reviews, comments, merges, server-side commits (`commit_changes`) and CI results on [GitCafe](https://git.cafe), through GitCafe's own MCP server (23 tools in its published server card). Read-only tools (`readOnlyHint`) run without approval; every other tool asks, including `submit_feedback`, which sends a report to the GitCafe team.

## Interface

GitCafe's official remote MCP server, `https://git.cafe/mcp` (Streamable HTTP; [docs](https://git.cafe/docs/account/mcp-connections), [server card](https://git.cafe/mcp/server-card)).

GitCafe's REST API also has an OpenAPI 3.1 document (`https://git.cafe/api/openapi/json`), but it is not mounted here. Its tokens are a separate audience (`https://git.cafe/api`) that the MCP server refuses, and the reverse, so it would need its own sign-in. Mounting it as well would also list the same issue and pull request operations twice.

## Auth

- **OAuth** (`oauth`): discovered from the MCP server's protected-resource metadata (authorization server `https://git.cafe`). Executor registers a public PKCE client through dynamic client registration (`tokenEndpointAuthMethod: none`, the only method the server lists) and sends the resource indicator `https://git.cafe/mcp`. Nothing has to be set up at GitCafe first: Executor registers its own redirect URI with the client. The person needs a verified GitCafe account. On the consent screen the person picks **All repositories you can access** or **Only select repositories…**, and the account reaches only those. To reach a repository outside a selection, connect again.
- Scopes: the server answers an unauthenticated `initialize`, so discovery finds no scope challenge and would otherwise request the protected resource's whole `scopes_supported` (95 permissions, admin included). The 11 declared scopes are the union of the scopes in the server's own 401 challenges for its tools: `repo:contents:read`, `issue:contents:read`, `pr:contents:read`, `pr:review:read`, `comment:contents:read`, plus `repo:contents:write` (`commit_changes`), `issue:contents:write`, `comment:contents:write`, `pr:contents:write`, `pr:review:write` and `pr:merge:write`.
- There is no personal access token method: GitCafe's personal access tokens work for the REST API and Git, not for the MCP server.

Health check: an MCP `initialize` with the account's token. A token the server does not accept answers 401 `invalid_token`. The standard MCP check (`mcpHealth`) is not used, because this server answers without credentials too (anonymous reads of public repositories), so that check could never verify an account.

## Known gaps

- Labels, assignees and milestones cannot be changed with the MCP tools, and CI cannot be started or cancelled (GitCafe's MCP docs).
- Which scopes `ci_read` needs on private repositories could not be confirmed without an account: on public repositories it answers without signing in, so it gave no scope challenge.
- Tool calls were not made against a real GitCafe account. The sign-in was checked against git.cafe up to its consent screen (discovery, registration and an authorization request it accepted). The token exchange, the health check and the tool calls were checked against a local stand-in that copies the server's OAuth and MCP behaviour.
- GitCafe limits dynamic client registrations to 10 an hour per network address, and deletes a registered client that is not used within a day ([rate limits](https://git.cafe/docs/reference/rate-limits)).
