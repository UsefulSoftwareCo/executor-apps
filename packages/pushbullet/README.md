# Pushbullet

Send and read pushes (notes, links, files), manage devices, chats, channel subscriptions, file upload slots, ephemerals and Android SMS threads through Pushbullet's REST API.

**Interface:** custom hand-written tools over https://api.pushbullet.com/v2 (25 operations). Pushbullet publishes no OpenAPI document, GraphQL API or MCP server; the endpoints follow https://docs.pushbullet.com.

**Auth**

- Access token (`apiKey`): create one at https://www.pushbullet.com/#settings/account ("Create Access Token"). Sent in the `Access-Token` header.
- OAuth (`oauth`): create an OAuth client at https://www.pushbullet.com/create-client and paste its client id and secret on the connect page. Set the client's redirect URI to the one Executor shows. Pushbullet has no scopes; the token is sent in the same `Access-Token` header.

**Gaps:** file bytes must be uploaded by the caller to the `upload_url` returned by `files.uploadRequest` (no binary upload tool). Realtime streaming (websocket) is not exposed. Mutations require approval.
