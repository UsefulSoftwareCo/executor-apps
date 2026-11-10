# Pexels

Search and fetch free stock photos, videos and collections from Pexels (9 read-only tools).

**Interface:** custom tools written with `fetch` against the official REST API (https://www.pexels.com/api/documentation/). Pexels publishes no OpenAPI document, so the nine documented endpoints are hand-written: photo search, curated and get; video search, popular and get; featured collections, your collections and collection media.

**Auth:** API key. Create one instantly at https://www.pexels.com/api/ (free account). It is sent in the `Authorization` header with no `Bearer` prefix. Pexels offers no OAuth for third-party apps.

**Gaps:** the API is read-only (collections cannot be edited). Default limits are 200 requests per hour and 20,000 per month. Pexels asks that you credit photographers and link to Pexels where results are shown.
