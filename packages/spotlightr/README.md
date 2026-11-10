# Spotlightr

Manage Spotlightr video hosting: create linked videos, replace sources, update player settings, list projects, read analytics (top videos, metrics, views), whitelist embed domains and manage course/gallery student access.

**Interface:** custom hand-written tools over Spotlightr's REST API (https://app.spotlightr.com/docs/api/, base `https://api.spotlightr.com`). Spotlightr publishes no OpenAPI document, GraphQL API or MCP server.

**Auth:** API key only (Spotlightr has no OAuth). In Spotlightr go to Settings > Integrations & APIs > Spotlightr API Key > Get API key. It is sent as the `vooKey` parameter on every request.

**Known gaps:** the docs do not specify response shapes, so results are returned as raw JSON. Video file upload (`createVideo` with `file`) and asset upload (`/assets`) need multipart bodies and are not exposed; only URL-linked videos can be created. `videos.delete` (`POST /api/deleteVideo`) is deliberately not exposed: the vendor documents `IDs` only as `Array` (example `[1234,5678]`) and does not specify the body encoding, and a wrong guess on a destructive bulk call is unsafe. `videos.updatePlayerSettings` sends `settings` as a JSON string in a form field; the vendor documents it as a JSON object with no body encoding and no list of valid keys, so this is unverified. `analytics.views` takes `allViews=1` to disable pagination (the vendor's "No data pagination" flag); without it results may be paginated, and no page/limit parameters are documented. `onlyWatched`/`allViews` are typed bool by the vendor and sent as `1`, matching its examples. The JavaScript player API and watch-page query params are client-side and out of scope.
