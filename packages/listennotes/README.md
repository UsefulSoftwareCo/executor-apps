# Listen Notes

Search and explore podcasts and episodes, browse genres, regions and curated lists, get recommendations, submit podcasts, and manage playlists through the Listen Notes podcast API.

## Interface

OpenAPI, from Listen Notes' official document at https://listen-api.listennotes.com/api/v2/openapi.json (32 tools, 11 mutations, none skipped). Mutations require approval.

## Auth

API key only. Listen Notes has no OAuth. Create a key in the dashboard at https://www.listennotes.com/api/dashboard/ and paste it as the API key; it is sent in the `X-ListenAPI-Key` header to `listen-api.listennotes.com`. Some endpoints (full-text search depth, playlists, audience data, batch lookups) depend on the key's plan.

## Known gaps

The free plan is limited and returns mock data for some endpoints; the account health check calls `/genres`.

## Icon

The Listen Notes magnifier and RSS-waves mark, from the official site asset https://www.listennotes.com/static/v4/img/logo/safari-pinned-tab.svg.

## Notes

`getEpisodesInBatch` and `getPodcastsInBatch` are read-only lookups but use POST, so the generator classifies them as mutations and they require approval (`always()`).
