# TinyPNG

Compress, resize and convert WebP, JPEG, PNG and AVIF images with the TinyPNG (Tinify) API, and write results to your own Amazon S3 or Google Cloud Storage bucket. Images are read from public URLs.

**Interface:** hand-written tools over the official REST API (`https://api.tinify.com`, reference at https://tinify.com/developers/reference). Tinify publishes no OpenAPI document, GraphQL API or remote MCP server. Tools: `shrink`, `download`, `process` (shrink plus resize, convert, background, preserve and store in one call) and `usage`.

**Auth:** API key. Create one at https://tinify.com/dashboard/api (the free plan allows 500 compressions a month). The key is sent as HTTP Basic auth with username `api`. The API has no account endpoint, so the health check posts an empty body to `/shrink`: a bad key returns 401 and a good key returns 400, neither costing a compression. There is no OAuth.

**Icon:** the official TinyPNG panda (apple-touch-icon from tinypng.com, 144px). The vendor publishes no SVG of the panda.

**Known gaps:**
- Raw file upload is not supported; source images must be reachable by URL.
- Image bytes are returned inline as base64, capped at 2 MB. Larger results should use the `store` option (S3 or GCS) instead.
- Each resize, convert or store costs an extra compression; preserving metadata does not.
- `usage` reads the Compression-Count header and returns null if the API omits it on the error response.
