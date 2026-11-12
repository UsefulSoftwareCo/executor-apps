# Google Tasks

Task lists and tasks in Google Tasks: list, create, update, complete, move (including reparenting
and reordering) and delete tasks, and clear completed tasks from a list.

## Curated tools

The top-level tools are shaped for agents, after [gogcli](https://github.com/openclaw/gogcli)'s typed tool set: `list` (open tasks from every list, soonest due first), `add` and `complete`. Reads span every linked account at once unless `account` names one; writes need `account` only when several accounts are linked, and ask for approval. The Tasks scope reveals no address, so results name each account by its account ID. Their code is `tools/`, copied from `shared/google-tools` by `node scripts/google-vendor.ts`, which also gives the same tools to the all-in-one `google` package. The generated tools described below are under `api`, each taking an `accountId`.

**Interface:** OpenAPI, converted from Google's own Tasks API v1 Discovery document (`https://tasks.googleapis.com/$discovery/rest?version=v1`) by `scripts/google-discovery.ts` into `openapi.json`, whose `info.x-executor-discovery` records the revision. Google publishes no OpenAPI for it.
Google has no official Tasks MCP server (`tasksmcp.googleapis.com` does not exist). Requests go to
`https://tasks.googleapis.com`. Mutations require approval.

**Auth:** OAuth 2.0 with your own Google OAuth client (Google has no dynamic client registration).
In the Google Cloud console, enable the Google Tasks API, configure the OAuth consent screen, and
create an OAuth client ID of type "Web application". Add the redirect URI shown on Executor's
connect page to the client's authorized redirect URIs, then paste the client ID and secret into the
connect page. The scope requested is `https://www.googleapis.com/auth/tasks`; the app asks for
offline access so it receives a refresh token.

**Known gaps:** no API-key method (the Tasks API only accepts user OAuth tokens); the API exposes no
user profile, so the connected account shows no name or email. While the OAuth consent screen is in
Testing status, Google expires refresh tokens after 7 days and limits test users to 100; publish the
consent screen (or re-consent regularly) for long-lived access.
