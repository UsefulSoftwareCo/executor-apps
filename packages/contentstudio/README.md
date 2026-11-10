# ContentStudio

Covers the ContentStudio social media management API: workspaces, connected social accounts, creating, scheduling and approving posts, campaigns, labels, team members, media, analytics and social inbox.

Interface: OpenAPI, ContentStudio's official document at https://api.contentstudio.io/api-docs.json (human docs at https://api.contentstudio.io/guide). Every operation is on `https://api.contentstudio.io`; mutations require approval.

Auth: API key only (ContentStudio offers no user-created OAuth apps). Generate it in the ContentStudio dashboard under Settings > API Keys (generate a new key and copy it); the key is sent in the `X-API-Key` header. The health check calls `GET /api/v1/me`.

Icon: the product mark (blue disc with three white slashes), extracted as an SVG from the mark paths of the vendor's logo lockup at https://contentstudio.io/images/contentstudio-logo.svg, with the wordmark left out.

Known gaps: none known; all 356 operations compile (0 skipped).
