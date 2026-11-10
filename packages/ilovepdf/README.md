# iLovePDF

Merge, split, compress, convert, OCR, protect, watermark and edit PDFs and images, and send e-signature requests, through the iLovePDF (iLoveAPI) REST API.

**Interface:** hand-written tools over the official REST API, https://www.iloveapi.com/docs/api-reference . iLovePDF publishes no OpenAPI document. The task workflow (`startTask`, `uploadFromUrl` / `uploadFile`, `processTask`, `downloadTask`) runs any of the 30+ PDF and image tools through one generic `processTask` taking the vendor's tool name and parameters; there are also task management and e-signature tools (20 tools in total).

**Auth:** project keys (public key and secret key). Create a project at https://www.iloveapi.com/user/projects and copy the public key (Project ID) and secret key. The app signs a one hour HS256 JWT with the secret key, with the public key in `jti`, as the vendor's own SDKs do (the docs do not spell out the claims; verified against the official ilovepdf-php source: HS256, empty iss/aud, jti is the public key, DELETE removes an uploaded file). listTasks sends the secret key as the `secret_key` query parameter, which the vendor requires for that server-side-only endpoint. iLovePDF offers no OAuth.

**Known gaps:**
- Downloads are returned as base64 and capped at 8 MB, since credentials are needed to fetch results.
- Uploads are single-request (no chunking) from a URL or base64 content.
- Webhook registration and the file encryption key option are not exposed.
- Tasks run on a vendor-assigned server (`apiNN.ilovepdf.com`), so later calls take the `server` returned by `startTask`.
