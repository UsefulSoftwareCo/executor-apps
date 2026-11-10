# Google Chat

Google Chat spaces, direct messages and group chats: list, find, create, set up, update and delete
spaces; list, search, send, edit and delete messages; manage members, reactions and pinned
messages; read space events; and manage your own read state, notification settings, availability,
sidebar sections and custom emojis. 50 tools.

**Interface:** hand-written tools over Google's official Chat REST API v1
(`https://chat.googleapis.com/v1`), written from Google's official Discovery document
(`https://chat.googleapis.com/$discovery/rest?version=v1`). Google publishes no OpenAPI document and
the APIs.guru conversion is stale (5 paths against 54 Discovery methods), so it is not used. Google's
official remote Chat MCP server (`https://chatmcp.googleapis.com/mcp/v1`) may exist, but its tool list
could not be verified from a vendor page, so it is not used. Mutations require approval.

**Auth:** OAuth 2.0 with your own Google OAuth client (Google has no dynamic client registration).
In the Google Cloud console, enable the Google Chat API, configure the OAuth consent screen, and
create an OAuth client ID of type "Web application". Add the redirect URI shown on Executor's connect
page to the client's authorized redirect URIs, then paste the client ID and secret into the connect
page. The app asks for offline access so it receives a refresh token. Scopes requested are the
user-level `chat.spaces`, `chat.messages`, `chat.memberships`, `chat.messages.reactions`,
`chat.spaces.pins`, `chat.users.readstate`, `chat.users.spacesettings`, `chat.users.availability`,
`chat.users.sections` and `chat.customemojis`. Chat requires a Google Workspace account; personal
Gmail accounts cannot use most of the API. The `useAdminAccess` options need Workspace administrator
privileges and the `chat.admin.*` scopes, which are not requested.

**Known gaps:** no API-key method (the Chat API only accepts OAuth tokens or app service accounts,
and these tools act as the signed-in user). Of the 54 Discovery methods, 50 are covered; omitted are
`spaces.completeImport`, `spaces.messages.attachments.get`, `media.upload` and `media.download`
(media endpoints use binary bodies; import mode is not supported). The API has no profile endpoint, so the connected
account shows no name or email. While the consent screen is in Testing status, Google expires
refresh tokens after 7 days.
