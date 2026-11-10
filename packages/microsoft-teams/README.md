# Microsoft Teams

Teams, channels, channel and chat messages and replies, chats and members, tabs, installed apps, tags, shifts schedules, the signed-in user's online meetings and presence, other users' presence, the Teams app catalog, team templates and activity notifications, through the Microsoft Graph v1.0 REST API (594 tools, 330 of them mutations, each mutation requiring approval).

## Interface

OpenAPI. The source is Microsoft's official Graph document, `microsoftgraph/msgraph-metadata` `openapi/v1.0/openapi.yaml`, pinned to commit `15780e98e1082517bc7a39a6b75b356a085326d9` (https://raw.githubusercontent.com/microsoftgraph/msgraph-metadata/15780e98e1082517bc7a39a6b75b356a085326d9/openapi/v1.0/openapi.yaml). The full document is 44 MB and covers all of Microsoft 365, so `openapi.json` is a slice built offline by `scripts/graph-slice.ts teams` (the source URL and generator are recorded in its `info.x-executor-slice`). The slice:

- keeps paths under `/teams`, `/chats`, `/teamsTemplates`, `/appCatalogs/teamsApps`, `/me/joinedTeams` (list only), `/me/onlineMeetings`, `/me/presence`, `/me/teamwork`, `/communications/presences`, `/communications/getPresencesByUserId`, `/teamwork` and `/teamwork/sendActivityNotificationToRecipients`. Duplicate addressings of the same resources (`/me/joinedTeams/{team-id}/...`, `/groups/{group-id}/team/...`, `/users/{user-id}/...`, `/me/chats/...`), tenant administration (`/teamwork/deletedTeams`, `deletedChats`, `workforceIntegrations`, `teamsAppSettings`) and the app-only `/communications/onlineMeetings` are left out;
- bounds schema depth: inside component schemas, references to other Graph entity types (navigation properties such as `team.channels` or `chatMessage.replies`) become a small object with `id` and `additionalProperties: true`. Each tool still has the full schema of the entity it reads or writes, and list tools return full entities;
- drops `discriminator` mappings and unused components, and shortens operationIds that repeat path-parameter names so every tool name stays under 100 characters.

Without the depth bound, the tool listing is 375.7 MB (every tool reached most of Graph's entity graph) and fails on hosted Executor; with it, the full listing is 3.6 MB. To pick up new operations, regenerate with the commands at the top of `scripts/graph-slice.ts`.

## Auth

OAuth 2.0 authorization code flow against the Microsoft identity platform (`login.microsoftonline.com/common`). Create the app in the Microsoft Entra admin center, App registrations, New registration. Microsoft Teams APIs need a work or school (Microsoft Entra) account; personal Microsoft accounts are not supported, so choose "Accounts in any organizational directory" (multitenant) or a single tenant, not personal accounts, add a Web redirect URI equal to the redirect URI Executor shows on the connect page, and create a client secret under Certificates & secrets. Enter the application (client) ID and secret on the connect page. Requested delegated scopes need no admin consent: `offline_access`, `User.Read`, `Presence.Read`, `Presence.ReadWrite`, `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChannelMessage.Send`, `Chat.Create`, `Chat.ReadWrite`, `ChatMessage.Read`, `ChatMessage.Send`, `OnlineMeetings.ReadWrite`.

## Known gaps

- Reading channel messages (`ChannelMessage.Read.All`), listing members (`TeamMember.Read.All`), creating channels (`Channel.Create`, admin consent required per Microsoft's permissions reference), creating teams (`Team.Create`), shifts (`Schedule.ReadWrite.All`) and managing apps need admin-consented scopes; those tools fail with 403 until the app registration is granted them and the account is reconnected with them.
- Nested entities in responses are typed only as `{ id, ... }` (the depth bound); the data Graph returns is unchanged, including anything requested with `$expand`.
- Other users' chats, joined teams and meetings (`/users/{user-id}/...`) and deleted teams are not included.
- Graph returns `@odata.nextLink` URLs for paging; use the `$skiptoken`/`$top` query parameters of each tool.
