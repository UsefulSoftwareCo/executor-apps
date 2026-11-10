# GitHub

Repositories, code search, issues, pull requests and users through GitHub's official remote MCP server, mounted under `mcp`, plus Actions, releases, organizations and the rest of the GitHub REST API (1,241 tools, 590 of them mutations, which ask for approval), mounted under `api`. Both use the same account.

**Interface:** GitHub's remote MCP server at https://api.githubcopilot.com/mcp/ (default toolsets; docs at https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md), and OpenAPI from GitHub's own description at https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json. MCP tools are listed live; every tool without `readOnlyHint` asks for approval.

## Auth

- **OAuth** (`oauth`, first): GitHub's authorization-code flow at `https://github.com/login/oauth/authorize` and `https://github.com/login/oauth/access_token`, requesting no scopes. GitHub has no client registration, but Executor Cloud has its own GitHub App for exactly these endpoints when a method declares no scopes, so on Cloud signing in is one click. A GitHub App has no scopes: its registered permissions decide what the token can do. On a host without that client, the connect page asks for one: register a GitHub App (Settings > Developer settings > GitHub Apps) with the redirect URI the connect page shows and the permissions you need, then enter its client ID and secret. A classic OAuth app also signs in, but its token without scopes can only read public data.
- **Personal access token** (`token`): a fine-grained or classic token from https://github.com/settings/tokens. Both the MCP server and the REST API accept it.

Health check: `GET https://api.github.com/user`.

## Known gaps

- Release asset upload (`uploads.github.com`) is skipped.
- The MCP server serves its default toolsets; the REST API covers the rest. MCP tools and annotations were not listed with a real account.
