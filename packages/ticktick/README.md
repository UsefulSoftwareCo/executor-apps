# TickTick

Projects and tasks in TickTick: list, create, update and delete projects; create, read, update, complete (singly or up to 50 at once), move, delete, search, filter and list completed or undone tasks; list tags (18 tools).

## Interface

Hand-written tools over TickTick's official Open API (`https://api.ticktick.com/open/v1`), documented in the Markdown API reference at https://developer.ticktick.com/docs/openapi.md. That reference has an OpenAPI layout but there is no machine-readable OpenAPI document, so the endpoints are declared in `index.ts`. Reads are queries; every other tool asks for approval.

## Auth

OAuth 2.0 only; TickTick has no personal API key. Create an app at https://developer.ticktick.com/manage, set its OAuth redirect URL to the one Executor's connect page shows, and paste the client id and secret. Scopes: `tasks:read tasks:write`. Authorization is `https://ticktick.com/oauth/authorize`, token is `https://ticktick.com/oauth/token` with HTTP Basic client authentication (the vendor reference is followed). Scopes are space separated. The vendor documents only the authorization_code grant, so the access token is not refreshed: reconnect if it expires or is revoked. Token lifetime is undocumented.

## Known gaps

- Tag creation/rename/delete, task comments and other newer endpoints in the reference are not exposed; only `tags.list` is.
- `projects.list` exposes the optional `offset` and `limit` query parameters.
- The Open API has no user endpoint, so the account health check lists projects and the account has no name.
- The Inbox is not returned by project listing; use `inbox<number>` (visible in a task's `projectId`) with `projects.getData`.
- Habits, focus records and comments are not part of the Open API.
