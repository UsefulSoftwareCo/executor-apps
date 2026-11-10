# ImageKit

Manage an ImageKit media library: files and versions, folders, tags, custom metadata fields, cache purge, bulk copy/move/rename jobs, saved extensions, named transformations, origins, URL endpoints and account usage.

**Interface:** two routes, chosen by how the account signs in.

- API key: OpenAPI, ImageKit's official document at https://raw.githubusercontent.com/imagekit-developer/openapi/main/openapi.yml (51 tools, 32 of them mutations that require approval). The spec's `create-dummy-test` operation is documented by ImageKit as an internal SDK-generation endpoint, so it is removed with a spec patch.
- OAuth: ImageKit's official remote DAM MCP server at https://imagekit.io/mcp/dam (search, upload from a computer or public URL, download, ZIP). Probed: it requires OAuth with dynamic client registration, discovered from its metadata. Its tools require approval unless they are read-only. Tool list not verified against a signed-in session.

**Auth:**
- API key: copy the **private API key** from https://imagekit.io/dashboard/developer/api-keys. It is sent as the HTTP Basic username with an empty password to `api.imagekit.io`.
- OAuth: sign in with your ImageKit account; no OAuth app to create (dynamic client registration).

**Known gaps:** ImageKit's upload operations (`POST /api/v1/files/upload` and `POST /api/v2/files/upload`) are served from `upload.imagekit.io`, a second host, so the OpenAPI compiler skips them as `multiple_hosts` (2 skipped). Uploads are therefore not exposed on the API-key route; use the OAuth sign-in (DAM MCP) to upload. Image delivery and transformation are URL-based and are not tools. The health check uses `GET /v1/accounts/origins`, which the spec marks beta.
