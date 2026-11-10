# Discord

Guilds, channels, messages, members, roles, threads, webhooks, emojis, stickers, scheduled events, application commands and the rest of the Discord REST API (242 tools, 141 of them mutations; every mutation asks for approval).

**Interface:** OpenAPI. Source is Discord's official OpenAPI 3.1 description, `https://raw.githubusercontent.com/discord/discord-api-spec/main/specs/openapi.json`, published by the `discord` GitHub organisation on `main` (not pinned to a commit). Requests go to `https://discord.com/api/v10`. No operations are skipped.

**Auth**

- Bot token: create an application at https://discord.com/developers/applications, open "Bot", reset and copy the token, and invite the bot to your server. Sent as `Authorization: Bot <token>`. This is the method that covers most tools (messages, channels, roles, members, guild admin).
- OAuth: on the same application, under "OAuth2", add the redirect URI shown on Executor's connect page, then enter the client ID and secret. Requested scopes are `identify`, `guilds`, `guilds.members.read` and `connections`; these act as the user, not as a bot. An OAuth account reaches 26 tools: `GET /users/@me`, `/users/@me/guilds`, `/users/@me/guilds/{guild_id}/member` and `/users/@me/connections`, plus 22 endpoints that need no Authorization header (gateway URL, invites, guild templates, widgets, sticker packs, OAuth2 keys, and webhook execute/edit/delete authenticated by the webhook token in the URL, plus the interaction callback and partner-sdk token routes, which are partner-only in practice).

**Known gaps**

- Everything else (guild, channel, message, member, role, emoji, application command and entitlement management) needs the bot token. Operations whose spec declares OAuth scopes this package does not request (`applications.commands.update`, `applications.entitlements`, `messages.read`, `role_connections.write`, `bot`, `guilds.join`, `rpc.*` and similar, or no scope at all) are hidden from OAuth accounts by spec patches in `openapi.ts`; four OAuth-only operations (role-connection get/put/delete and `GET /users/@me/applications/{application_id}/entitlements`) are removed entirely. Restricted scopes are deliberately not requested. The patches name spec paths, so a renamed path upstream will need them updated.
- The Gateway (real-time events, voice) is not part of the REST API and is not covered.
- File uploads in multipart message requests are not supported.
- Icon is Simple Icons' Discord mark.
