# Reply.io

Sales engagement on the Reply.io v3 API: contacts and lists, company accounts, sequences and steps, inbox threads, email and LinkedIn accounts, templates, blacklist rules, enrichment, reporting and AI SDR.

## Interface

OpenAPI 3.1, Reply's official bundled document: https://docs.reply.io/api-reference/bundled.yaml (base URL https://api.reply.io). The YAML repeats about 3,800 YAML aliases, past the framework parser's limit of 100, so the package embeds the same document converted from YAML to JSON on 2026-10-12 (`document.json`, unmodified apart from format; only the top-level `security` is patched in `openapi.ts` to add the acting-user headers). Refresh it by re-downloading the YAML and converting. Every non-GET operation is a mutation and requires approval, including POST filter and search endpoints; that is deliberately conservative.

## Auth

API key only. Reply's v3 API uses `Authorization: Bearer <key>` (the `X-Api-Key` header belongs to the deprecated v1/v2 API). Create the key in Reply under Settings -> API Key (https://run.reply.io). Keys carry scopes, so a restricted key only reaches the matching tools. Reply publishes no user-created OAuth apps for the REST API, so OAuth is not offered.

Key types, per Reply's authentication docs:

- User key: leave `userId`, `userEmail` and `teamId` empty.
- Team key: acts as the team owner unless you set `userId`, or `userEmail`, to act as another user.
- Organization key: always requires an acting user, otherwise every request fails with `403 USER_REQUIRED`. Set `userId` (sent as `X-User-Id`), or `userEmail` together with `teamId` (`X-User-Email` and `X-Team-Id`). The user must belong to the organization. An organization key with none of these fails the health check by design.

Health check: `GET /v3/whoami`, which Reply documents as the credential check that needs no scope. It sends the same acting-user headers as tool calls. It only proves the key authenticates, not that it holds the scopes a tool needs.

## Icon

Reply's own mark, from the favicon on its docs site (https://mintcdn.com/reply-3e86852c/y2jDsVA40y9FU6Pb/icons/favicon.svg).

## Gaps

Reply also runs an official remote MCP server (https://mcp.reply.io/, 70 tools); the OpenAPI document covers far more operations, so it is not used.
