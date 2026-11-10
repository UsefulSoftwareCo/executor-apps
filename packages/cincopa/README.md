# Cincopa

Manage Cincopa media from Executor: galleries, assets, uploads (including upload from URL and upload tokens), white-label portals, webhooks and live streams. 38 tools.

**Interface:** OpenAPI, generated from Cincopa's own REST API v2 document at https://developer.cincopa.com/_spec/apis/index.yaml?download (API reference: https://developer.cincopa.com/apis). The document declares no security scheme, so `openapi.ts` patches each operation to take the account's token as the `api_token` query parameter; it never appears in a tool's input.

**Auth:** API token (`apiKey`). Create one under Profile icon, Account Dashboard, API Tokens, Create New (https://developer.cincopa.com/guides/developer-documentation-and-apis/what-is-an-api-token-how-to-create-edit-and-remove-an-api-key), and set the token's access permissions (Read Only is available; server-side use can also allow write and delete) to the access you want the agent to have. The API documentation describes token auth only.

**Approvals:** all POST operations need approval. The live-stream operations (`live.liveCreate`, `liveStart`, `liveStop`, `liveReset`, `liveDelete`) and the credential or upload-minting operations `general.getTemp` (temporary API token), `upload.uploadGetUploadToken` and `assets.assetGetUploadUrl` are GET requests in Cincopa's API but change state or mint access, so they need approval too. `gallery.galleryDownload` only returns a zip link to content the token can already read, so it does not.

**Gaps:** file bytes cannot be uploaded directly; use `assets.assetUploadFromUrl`, or `assets.assetGetUploadUrl` to get a URL to post to. `upload.uploadIframe` returns HTML rather than JSON.
