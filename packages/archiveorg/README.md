# Archive.org

Internet Archive tools: search items and collections, read item metadata and text files, edit metadata, upload and delete files, write reviews, inspect and queue catalog tasks, read view statistics, fetch IIIF manifests, and use the Wayback Machine (availability, CDX index, Save Page Now). 21 tools.

## Interface

Hand-written tools over the Internet Archive's public HTTP APIs. Archive.org publishes no official OpenAPI document (the APIs.guru specs are community-made and cover only Wayback and search), so each tool calls the documented endpoint directly: `archive.org/advancedsearch.php`, `/services/search/v1/scrape`, `/metadata`, `/services/reviews.php`, `/services/tasks.php`, `s3.us.archive.org` (S3-like API), `web.archive.org` (CDX, Save Page Now), `iiif.archive.org`, and `be-api.us.archive.org/views/v1`. Docs: https://archive.org/developers/.

## Auth

IA-S3 keys (access key and secret key), sent as `Authorization: LOW access:secret`. Create them at https://archive.org/account/s3.php while signed in. Read-only public endpoints work with any valid key; writes need an account that can edit the item. There is no OAuth for third-party apps.

## Gaps

Uploads send text content only (no binary or multipart). The Changes API (auth required) and Simple Lists are not covered, nor is Reviews moderation. Only the connected account's own review is available through the Reviews API; read all reviews through items.metadata with path `reviews`. Save Page Now returns a job id; poll it with wayback.saveStatus. Health check uses the tasks service, which rejects invalid keys.
