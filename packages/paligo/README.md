# Paligo

Documents (topics, components, publications) and their XML content, folders, forks (publication structure), taxonomies, search (beta), productions and publish settings, translation exports, variables (sets, variants, variables, values), assignments, groups, users and content import status in Paligo.

## Interface

Hand-written tools over the official Paligo REST API v2 (`https://<instance>.paligoapp.com/api/v2`, reference at https://api.paligo.net/en/index-en.html). Paligo publishes no OpenAPI document, no GraphQL API and no MCP server, so the endpoints are wrapped directly (61 tools). List tools take `page` and `per_page`; create and update tools take a JSON `body` documented in each tool description. Every create, update and delete tool (and production start/cancel) requires approval. `search.run` is read-only even though the API uses POST.

## Auth

API key with HTTP Basic auth. In Paligo, create an API key (see https://docs.paligo.net/en/paligo-rest-api.html) for an admin user, then enter:

- **Instance**: the name in `https://<instance>.paligoapp.com`, for example `mycompany`.
- **Username**: the Paligo username (email address) of the admin user.
- **API key**: sent as the Basic auth password.

The API is available on Business plans and up. Paligo documents no OAuth flow, so none is declared.

## Known gaps

- Multipart and binary endpoints are not wrapped: image upload/update and download, content import creation, translation import creation, and output zip download (`/outputs/{name}`).
- Per-minute rate limits apply; HTTP 429 is retried twice honoring `Retry-After` (capped at 30 seconds).
- Vendor icon: the official Paligo site icon (512px PNG, https://paligo.net/wp-content/uploads/cropped-faivcon.png); Paligo publishes no brand-page SVG of the dot mark.
