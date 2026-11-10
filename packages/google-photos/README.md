# Google Photos

Create, list and edit albums, add and remove items, search and edit media items this app created (Photos Library API), and let the user pick photos through a Picker session and list the picked items (Photos Picker API). 16 tools; 8 mutations require approval (Library: 6, Picker `sessions.create` and `sessions.delete`: 2; `mediaItems.search` and `batchGet` are queries). `scripts/check.sh` compiles only the Library spec (12 tools); the Picker spec (4 tools) is checked by inspection only.

## Interface

OpenAPI, vendored as `openapi.json` (Library, 12 tools, mounted as `library`) and `picker-openapi.json` (Picker, 4 tools, mounted as `picker`). Google publishes these APIs only as Discovery documents and has no official Photos MCP server, so `discovery-to-openapi.mjs` converts Google's own documents (`https://photoslibrary.googleapis.com/$discovery/rest?version=v1` and `https://photospicker.googleapis.com/$discovery/rest?version=v1`, both revision 20261008) into OpenAPI 3, leaving out the methods listed under Known gaps. APIs.guru does not carry a Photos spec. The conversion is ours, not Google's, and the output is checked in. To refresh, download the documents and run `node packages/google-photos/discovery-to-openapi.mjs <doc> > <out>.json`. Paths use Google's `flatPath` form, so pass bare ids (`albumsId`, `mediaItemsId`, `sessionsId`).

## Auth

OAuth 2.0 only, with your own Google OAuth client (Google has no dynamic client registration). In Google Cloud Console enable the "Photos Library API" and "Photos Picker API", configure the consent screen (add test users while unverified) and create an OAuth client of type "Web application". Add the redirect URI shown on Executor's connect page to the client's authorized redirect URIs, then paste the client ID and secret into the connect page. Discovery is from `https://accounts.google.com`; `access_type=offline` and `prompt=consent` ensure a refresh token. Scopes: `photoslibrary.appendonly`, `photoslibrary.readonly.appcreateddata`, `photoslibrary.edit.appcreateddata`, `photospicker.mediaitems.readonly`. While the consent screen is in Testing status, refresh tokens expire after 7 days. Not verified with a real account.

## Known gaps

- Sharing is not available. Google's [authorization page](https://developers.google.com/photos/overview/authorization) lists `photoslibrary.sharing` as removed after 31 March 2025, and the Discovery document still lists it on `albums.share`, `albums.unshare` and `sharedAlbums.*` (`sharedAlbums.get` also stopped working then). The scope is not requested and those methods are excluded by `discovery-to-openapi.mjs`.
- `mediaItems.batchCreate` is excluded: it needs an upload token from the raw `POST https://photoslibrary.googleapis.com/v1/uploads` endpoint, which is outside the Discovery document and not exposed, so the tool would be unusable.
- Since March 2025 Google restricts the Library API to content the app itself uploaded; it can no longer read or search the user's whole library (the broad `photoslibrary` and `photoslibrary.readonly` scopes are not requested). To reach arbitrary existing photos, use the Picker tools.
- No profile endpoint exists, so the connected account shows no name or email; the health check requests `albums?pageSize=1` and returns an empty result.
