# Amara

Subtitles and captions on Amara: videos and their URLs, subtitle languages and versions (fetch and upload in json, dfxp, srt, vtt, sbv, ssa), workflow actions and notes, teams, members, projects, applications, subtitle requests, activity feeds, users and messages (50 tools).

Interface: hand-written tools over Amara's REST API, documented at https://apidocs.amara.org/ (base `https://amara.org/api/`). Amara publishes no OpenAPI document and no MCP server, so every tool is written against the official API reference.

Auth: API key. Generate it on your Amara account page (https://amara.org/en/profiles/account/) and add it as the account's API key. It is sent in the `X-api-key` header to `amara.org` only. There is no OAuth.

Mutations (create, update, delete, upload, messages) require approval.

Known gaps: team creation and adding members to arbitrary users need an Amara partner account; the deprecated global `/activity/` endpoint is not exposed; raw subtitle file downloads are returned through the JSON `subtitles` field (use `subFormat`).

## Notes

- `videos.setPrimaryUrl`, `videos.deleteUrl` and `teams.reviewApplication` accept a `resource_uri` in absolute or relative form; only the `amara.org` origin is accepted.
- Users can be addressed as `id$<userid>`; the `$` is sent unencoded because Amara 404s on `%24`.
- `subtitleRequests.update` clears an assignment through `unassign` (any of `subtitler`, `reviewer`, `approver`), which sends `null`.
