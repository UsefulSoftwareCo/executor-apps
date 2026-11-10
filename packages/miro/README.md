# Miro

Miro boards and everything on them: boards and members, items (sticky notes, shapes, cards, text, images, documents, frames, embeds), connectors, tags, groups, mind maps, board exports, teams, and organization administration.

## Interface

OpenAPI, from Miro's official specification for the REST API v2 in [miroapp/api-clients](https://github.com/miroapp/api-clients/blob/39161f97cee3f887f5f67cf4a003ce93b3a6903b/packages/generator/spec.json), pinned to commit `39161f9` (the head of `main` on 2026-10-12) so the tool surface only changes with this package. Bump the SHA in `openapi.ts` to pick up new endpoints. All operations are served from `https://api.miro.com`. Every mutation asks for approval.

## Auth

- **Access token** (`token`): create an app at [miro.com/app/settings/user-profile/apps](https://miro.com/app/settings/user-profile/apps), open it and use "Install app and get OAuth token" to get a token for your own team. Paste it into Executor.
- **OAuth 2.0** (`oauth`): use the same Miro app. In its settings add the redirect URI shown on Executor's connect page, then paste the client id and client secret there. Scopes requested: `boards:read`, `boards:write`, `organizations:read`, `organizations:teams:read`, `organizations:teams:write`. The organization scopes only work for Enterprise plans.

## Known gaps

- Enterprise-only endpoints (organizations, teams, board export, legal hold) fail on other plans.
- The spec's SCIM provisioning paths (`/Users`, `/Groups`, `/ServiceProviderConfig`, `/ResourceTypes`, `/Schemas`) are removed: they need a SCIM credential, not an OAuth or app token. The Miro SCIM API (`https://miro.com/api`, API key) is a separate Enterprise product and is not covered.
- `DELETE /v2/boards/{board_id}/groups/{group_id}?` (groups.deleteGroup) is skipped (`operation_path`) because the spec path has a stray trailing `?`; use the ungrouping endpoints instead.
- `POST /v1/oauth/revoke` is removed: Miro's document calls it vulnerable and deprecated because the token goes in the URL. Use `POST /v2/oauth/revoke`. It sends no account credential: the token to revoke and its client ID and secret go in the request body.
- Miro's Web SDK and the Miro MCP server (`https://mcp.miro.com/`) are not used.
