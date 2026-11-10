# Rollbar

Rollbar error tracking: items and their occurrences, comments and history, deploys, environments, metrics and reports, RQL jobs, projects, teams, users, project access tokens, notification rules, service links and symbol/source map uploads.

Interface: OpenAPI, Rollbar's official API description published on its docs site, `https://docs.rollbar.com/openapi/62de9e1b6316c304034d006a` (Rollbar API v1, origin `https://api.rollbar.com`). Rollbar's own MCP server is a local stdio server, not a remote one, so it is not used. The description declares no security schemes and lists the token as a required header parameter on many operations, so `openapi.ts` declares the `X-Rollbar-Access-Token` header scheme and `patches.json` strips that parameter from the operations so the token is never a tool argument.

Auth: access token (`apiKey`). Rollbar has no user-created OAuth apps. Create a project access token under Project Settings > Project Access Tokens (read scope for reading, write for changes, `post_server_item` / `post_client_item` for reporting items), or an account access token under Account Settings > Account Access Tokens for account-level endpoints (projects, teams, users, access tokens). Paste it when connecting; add one connection per token, since each token's scope decides which tools work.

Known gaps: 17 operations are skipped because their schemas use unresolved references. The 50 mutating tools always require approval. Multipart upload endpoints (sourcemaps, dSYM, ProGuard, Flutter symbols) depend on the framework's handling of file bodies.
