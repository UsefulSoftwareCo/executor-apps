# SoundCloud

Search and read tracks, playlists and users, and manage your own uploads, playlists, likes, reposts, follows and comments through the SoundCloud public API (68 tools; mutations require approval).

Interface: OpenAPI, from SoundCloud's official document at https://developers.soundcloud.com/docs/api/explorer/api.json (server `https://api.soundcloud.com`).

## Auth

- OAuth 2.1 (authorization code with PKCE): register an app at https://soundcloud.com/you/apps (API access is granted by SoundCloud), then enter its client ID and secret on the connect page. Add Executor's redirect URI to the app's redirect URIs. SoundCloud defines no scopes. Tokens are sent as `Authorization: OAuth <token>`.

## Known gaps

- SoundCloud only issues API credentials to approved apps, and the client-credentials flow (public data only) is not offered; connect uses the user authorization flow.
- Stream and preview endpoints return redirect URLs rather than audio bytes.
