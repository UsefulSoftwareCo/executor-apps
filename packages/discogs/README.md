# Discogs

Search the Discogs music database (releases, masters, artists, labels) and manage user collections, wantlists, lists and marketplace inventory, listings and orders.

Interface: hand-written tools over the Discogs REST API at https://api.discogs.com ([docs](https://www.discogs.com/developers)). Discogs publishes no official OpenAPI document and has no official MCP server, so each tool is written against the documented endpoints. Requests send a descriptive `User-Agent`, which Discogs requires.

Auth: personal access token. Create one at https://www.discogs.com/settings/developers ("Generate new token"); it is sent as `Authorization: Discogs token=...`. Health check calls `/oauth/identity`.

Known gaps: Discogs' user-created OAuth apps use OAuth 1.0a, which Executor's OAuth support does not cover, so only the token is offered. Image URLs need authentication and are returned as links only. Database contribution endpoints, release submission and inventory CSV export/upload are not exposed. Discogs rate-limits to 60 requests per minute when authenticated.
