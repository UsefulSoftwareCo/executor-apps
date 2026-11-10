# Upload to URL

Upload files to public CDN URLs with optional expiry, check filenames, fetch or delete uploaded files, list supported formats, and publish HTML pages (uploadtourl.com).

**Interface:** OpenAPI, the vendor's own live FastAPI document at https://uploadtourl.com/api/openapi.json. The document declares no servers and only lists the API key as a required `x-api-key` header parameter, so `openapi.ts` patches in the base URL and a header security scheme, which attaches the account key automatically. It also removes dashboard, billing, MCP transport, webhook and discovery routes (they use session tokens or are internal). 8 tools remain: health, key verification, supported formats, filename check, upload, get/delete file, publish HTML.

**Auth:** API key. Create it in the Upload to URL dashboard at https://uploadtourl.com. It is sent as the `x-api-key` header to `uploadtourl.com`. No OAuth.

**Known gaps:** dashboard, key management, custom domain and checkout routes use dashboard session tokens and are not exposed. The vendor's own MCP endpoint (`/api/mcp`, upload and file status) is not mounted because the OpenAPI tools cover it. Uploads are multipart, so large binary files depend on the framework's multipart support. Mutations require approval.
