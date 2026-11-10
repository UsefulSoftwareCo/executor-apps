# ShortPixel

Compress, resize, convert (WebP/AVIF), upscale and background-remove images with the ShortPixel Reducer API, and check API key credit usage.

**Interface:** hand-written tools over ShortPixel's REST API at `https://api.shortpixel.com/v2`. `reducer.php` is documented at https://shortpixel.com/api-docs; `api-status.php` is not. ShortPixel publishes no OpenAPI document, GraphQL API or MCP server. Tools:
- `account.status` (`POST api-status.php`, undocumented): account/quota status for the key. The endpoint and its form-field `key` body come from the official shortpixel-php client (`lib/ShortPixel/Client.php`, `apiStatus`; the client README calls it "Get account status and credits info"). The success `Status.Code` and quota field names are unverified (no real key was available); a dummy key returns HTTP 200 with `Status.Code` -402. The tool returns the raw JSON.
- `images.optimize` (`POST reducer.php`): optimize up to 100 public image URLs with the documented options (`lossy`, `wait`, `resize`, `resize_width`, `resize_height`, `upscale`, `convertto`, `bg_remove`, `keep_exif`, `cmyk2rgb`, `refresh`). Status code 1 means still processing; repeat the call to poll.

**Auth:** API key only (`apiKey`). Copy it from the ShortPixel dashboard (https://shortpixel.com/knowledge-base/article/where-is-my-api-key/). ShortPixel has no OAuth and no auth header: the key is sent in the request (multipart form body for status, JSON body for the Reducer; never the URL), so the app reads it from the account fields. Host: `api.shortpixel.com`. The health check calls the undocumented `api-status.php` and fails on a negative `Status.Code` (unverified for valid keys). Limit: `urls` is capped at 100 by the API (-107), not by the schema.

**Approvals:** `images.optimize` spends credits and requires approval.

**Known gaps:** `post-reducer.php` (multipart upload of local files) and `reducer-sync.php` (returns raw image bytes) are not exposed, since tools return JSON only. This covers the documented URL-based API plus the undocumented status call. The CDN domain quota endpoint is not mounted.
