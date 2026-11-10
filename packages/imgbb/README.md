# ImgBB

Uploads images to [ImgBB](https://imgbb.com) free image hosting. The tool takes an image URL or base64 data, an optional name and an optional expiration (60 to 15552000 seconds; the schema cannot enforce bounds, so ImgBB validates them) and returns the hosted, thumbnail, medium and delete links.

**Interface:** hand-written tool over the official ImgBB API v1, `POST https://api.imgbb.com/1/upload` ([docs](https://api.imgbb.com/)). ImgBB publishes no OpenAPI document, GraphQL API or MCP server.

**Auth:** API key. Get it at <https://api.imgbb.com/> (sign in or create an account and copy your API key from your account there; ImgBB does not document the exact dashboard location). ImgBB sends it as the `key` query parameter. There is no OAuth.

**Health check:** ImgBB has no read-only endpoint, so the check posts an upload with no image; nothing is uploaded. A wrong key is answered with HTTP 400 `{"error":{"message":"Invalid API v1 key.","code":100}}`, which fails the check, as does any response that is not ImgBB's JSON envelope. ImgBB documents no error codes, so no other response is interpreted.

**Gaps:** the public API has only the upload endpoint. Listing, albums and deleting need the web UI; `delete_url` in the upload response deletes an image when visited. Binary multipart file upload is not exposed; pass base64 instead. Icon is ImgBB's official app icon (`simgbb.com/images/favicon.png`, 300px), as Simple Icons has no ImgBB mark.
