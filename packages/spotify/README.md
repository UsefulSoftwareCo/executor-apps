# Spotify

Search the Spotify catalog (tracks, albums, artists, shows, episodes, audiobooks), read and edit playlists, manage the saved library and followed artists, read listening history and top items, and control playback on Spotify Connect devices. 96 tools, 36 of them mutations (each requires approval).

**Interface:** OpenAPI. Spotify's official document, https://developer.spotify.com/reference/web-api/open-api-schema.yaml, served against `https://api.spotify.com/v1`.

**Auth:** OAuth 2.0 authorization code only. Spotify issues no personal access tokens, and its client-credentials flow cannot reach user data, so no API key method is offered.
Create an app at https://developer.spotify.com/dashboard, copy its Client ID and Client Secret into the connect page, and add Executor's callback URL shown there as a Redirect URI on the app (Spotify matches it exactly). Scopes requested cover the generated tools (playlists, library, follow, top items, recently played, playback read and control, image upload); `streaming` and `app-remote-control` are left out because they are for in-app SDK players.

**Known gaps:**
- Spotify apps in development mode only serve users added under "User Management" in the dashboard, and playback control requires a Premium account.
- Spotify's official spec marks 48 of the 96 operations as `deprecated: true`, so about half the tools may return 403 for apps created recently. Deprecated groups: `/audio-features`, `/audio-analysis`, `/recommendations`, `/artists/{id}/related-artists`, `/browse/*`, `/markets`, the bulk `/tracks`, `/albums`, `/shows`, `/episodes` and `/audiobooks` lookups, the playlist tracks endpoints, and many `/me/*` library and follow endpoints. They are kept because older apps and extended-access apps can still call them.
- Spotify also runs a pilot MCP server (`https://mcp-gateway-external-pilot.spotify.net/mcp`). It was not probed or assessed; the official Web API OpenAPI document was chosen as the interface.
