# SmugMug

Photo hosting on SmugMug: users and profiles, the folder and album tree (nodes), albums and their images, image size details and metadata, plus creating, updating and deleting folders, albums and images.

**Interface:** hand-written tools over the official SmugMug API v2 (`https://api.smugmug.com/api/v2`, docs at https://api.smugmug.com/api/v2/doc). SmugMug publishes no OpenAPI document and no MCP server, so no spec is used. Tools take path ids as strings, `query` for URL parameters (`start`, `count`, `_expand`, `_filter`) and, for writes, a JSON `body`. Paths use SmugMug's `!` operation suffix (for example `/api/v2/album/SJT3DX!images`). A generic `request` tool reads any other GET path. All writes require approval.

**Auth:** SmugMug supports only OAuth 1.0a and API keys, which Executor's OAuth support does not cover, so both are offered as secrets.
- API key (public, read-only): request a key at https://api.smugmug.com/api/v2/doc/tutorial/api-key.html and paste the API key. Sent as the `APIKey` query parameter.
- OAuth 1.0a credentials: paste the API key and secret from the same page, plus an access token and token secret for your own account. Obtain them by running SmugMug's OAuth 1.0a flow once (https://api.smugmug.com/api/v2/doc/tutorial/authorization.html) with `Access=Full` and `Permissions=Modify` for writes; access tokens do not expire until revoked. Requests are signed with the PLAINTEXT method over https, which SmugMug allows.

**Secrets:** the API key and OAuth 1.0a fields are marked `raw`, so app code reads them in plain text; the app signs PLAINTEXT requests itself (percent-encoding the real values) and sends the API key as a query parameter. Signing is unverified end to end because no credentials were available.

**Unverified endpoints:** the vendor reference was not able to confirm `!sizes`, `!shareuris`, `!comments`, user `!albums`, `!recentimages` or `!popularmedia`, so there are no dedicated tools for them; the generic `request` tool can still try them. Paths are restricted to `/api/v2` on api.smugmug.com with no `..` segments.

**Known gaps:** no uploads (they go to `upload.smugmug.com` as binary bodies), no image move/collect/sort operations, no search, commerce or print-order endpoints, and no in-app OAuth flow.
