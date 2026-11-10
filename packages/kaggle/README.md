# Kaggle

Kaggle competitions, datasets, notebooks, models, benchmarks, hackathons and forums: 71 tools from Kaggle's own remote MCP server (search, leaderboards, dataset and model metadata and downloads, notebook sessions and outputs, competition submissions, forum topics, user profiles).

Interface: Kaggle's official remote MCP server, `https://www.kaggle.com/mcp` (streamable HTTP). Kaggle publishes no current OpenAPI document (the old Swagger file is superseded by its internal SDK), so the MCP server is the most complete official surface. Tool names and schemas come from the server and may change.

Auth, both sent as `Authorization: Bearer ...`:

- API token: create one at kaggle.com, Settings, API. Paste the token (the `KAGGLE_API_TOKEN` value).
- OAuth: the server publishes RFC 8414 metadata with a dynamic registration endpoint (PKCE S256, scope `resources.admin:*`), but Kaggle only registers clients whose redirect URI is a localhost URI (tested: an https redirect gets "Redirect uri must be a localhost uri"). A host with a localhost callback, such as a local Executor, can register itself. On a host with an https callback (hosted Executor) registration is refused, so the connect page asks for a client ID instead; Kaggle's API docs say public clients must request one from the Kaggle team. Use the API token there. Kaggle derives the client ID from the client name and rejects short IDs at authorize ("ClientId too small"); Executor registers as "Executor", giving `executor`, which works, but other client names may not.
- Account check: Kaggle answers `initialize` and `tools/list` without credentials, so the generic MCP check cannot prove an account. The check calls `get_accelerator_quota` (the caller's own quota, no arguments), which fails with "Unauthenticated" without a valid token.

Kaggle marks no tool read-only, so all 71 tools, including search and `get_*` reads, require approval.

Known gaps: the legacy `username:key` Basic auth is not offered; the legacy key is not documented for the MCP endpoint. The tool list is only checked with an anonymous `tools/list`; no authenticated calls were made, so the account check's success path (a non-error result from `get_accelerator_quota`) is unverified. The `KGAT` token format and Bearer header come from Kaggle's docs summary; the docs page did not render for confirmation.
