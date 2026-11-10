# Roam

Roam HQ (ro.am) virtual office. 85 tools in three groups: `chat` (70 operations: chats, messages, scheduled and streamed messages, reactions, uploads, groups, users and status, meetings, transcripts, calendar, lobbies, magicasts, guest badges, token info), `onair` (11 operations: On-Air events, guests, attendance) and `webhooks` (4 operations: subscriptions and failed deliveries).

**Interface:** OpenAPI, from Roam's official specs at <https://developer.ro.am/chat-v1.json>, <https://developer.ro.am/onair.json> and <https://developer.ro.am/webhooks-v1.json> (all on `https://api.ro.am/v1`). Mutations ask for approval; the POST operations that only read (`chat.search`, `chat.link.resolve`, `meeting.link.info`, `meeting.prompt`) do not.

## Auth

- **API key / personal access token:** an organization API key is created in Roam Administration > Developer (Add ApiClient, authorization type API Key). A personal access token is created under User Settings > Developer when workspace policy allows. Paste either as the token. Scopes are chosen when the key or token is created.
- **OAuth:** create an OAuth ApiClient in Roam Administration > Developer, choose its scopes, and register Executor's redirect URI exactly (no wildcards). Enter the Client ID and Client Secret on the connect page. Endpoints are discovered from `https://ro.am/.well-known/oauth-authorization-server`. Access tokens last 7 days and refresh. Executor requests the scopes Roam advertises in its protected-resource metadata (`https://api.ro.am/.well-known/oauth-protected-resource`): chat (`chat:history`, `chat:read`, `chat:send_message`, `chat:join`), group, user (including `user:read.email`, `user:read.status`, `user:write.status` and the status bubble scopes), `meetings:read`, `transcript:read`, calendar read/write, `folders:read`, `item:write`, `lobby:read`, `magicast:read`, `meetinglink:read`/`meetinglink:write`, On-Air and webhook scopes. `chat:send_message` satisfies the write operations (the specs say `chat:send_message` or `chat:write`). Scopes named only in the specs and not advertised by Roam (`guest:*`, `user:*.activity`, `recordings:read`, `links:*`, `userauditlog:read`, `admin:*`) are intentionally left out, so those tools work only with API keys or tokens granted them; Roam does not allow `client_credentials`.

## Known gaps

- The SCIM 2.0 API (`https://api.ro.am/scim/v2`, user and group provisioning) is a separate SCIM token and is not included.
- Legacy v0 specs are not used. File upload (`item.upload`, raw bytes) is exposed but is awkward without binary support; prefer `asset.create`. `asset.create` and `item.upload` only return an upload instruction; the bytes go to `https://uploads.ro.am/` with the returned `uploadHeaders`, which the generated tools do not perform, and the account token is never sent there.
- Roam rate limits to a burst of 10 and 1 request per second; personal access tokens have 1,000 requests per day.
