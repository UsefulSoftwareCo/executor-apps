# DialMyCalls

Send and manage voice and text (SMS) broadcasts with DialMyCalls: calls, texts and incoming replies, recordings (text-to-speech, URL, phone), contacts, do-not-contact list, groups, caller IDs, keywords, shortcodes, vanity numbers and access accounts. 56 tools.

**Interface:** custom tools written with `fetch` against the official DialMyCalls API v2 at `https://api.dialmycalls.com/2.0`, documented at https://www.dialmycalls.com/api-documentation. The vendor publishes no downloadable OpenAPI/Swagger file (its SDKs are Swagger-generated but the spec is not hosted), so the operations and parameters were transcribed from the docs (the vendor's SDK reference was a secondary check) at https://github.com/dialmycalls/php-sdk-v2. Mutations (including creating broadcasts, which place real calls and send real SMS) require approval. List tools take `from`/`to` (1-based, inclusive) and send them as the `Range: records=from-to` header; the API returns at most 100 records per call.

**Auth:** API key, sent as HTTP basic auth with the key as the username and an empty password (`Authorization: Basic base64("<key>:")`), which is what the vendor documents (`https://{ApiKey}@api.dialmycalls.com/`). The vendor SDK README also mentions an `X-Auth-ApiKey` header; this package does not use it. Find the key in the DialMyCalls account under members management, API Info (https://www.dialmycalls.com/members/v2/management.php). DialMyCalls has no OAuth.

**Request bodies:** tool inputs are camelCase; they are converted to the snake_case keys the API requires (`send_at`, `callerid_id`, `keyword_id`, ...) in `body.ts`, covered by `body.test.ts`. `vanityNumbers.update` takes `callOptions` as an object of booleans (`voicemail`, `ptt`, `optin`, `repeat`), matching the vendor's example body even though its field table says "array".

**Known gaps:** the call `addOns` (push-to-talk, push-to-record, etc.) and polling options of `calls.create` are not exposed; the vendor documents no webhook or trigger API. The vendor's docs mention an API version 3 that is not publicly documented, so this targets v2. The voicemail-list and voicemail-delete docs contradict themselves on return types, so those responses are passed through untouched. Response bodies are returned as raw JSON because there is no published schema.

**Icon:** the mark-only glyph cropped from the vendor's official `dmc-logo.svg` (viewBox cut to the mark; wordmark removed), with the black bracket drawn white in the dark variant.
