# Geekflare

Geekflare's web utility API: web and meta scraping, search, brand lookup, screenshots, URL to PDF, DNS records, DNSSEC, TLS scan, ping, MTR, open ports, site status, redirect and broken link checks, mixed content, load time and Lighthouse.

Interface: OpenAPI 3.1, Geekflare's official document at https://docs.geekflare.com/endpoint/openapi.json (18 operations, all POST against `https://api.geekflare.com`). Geekflare also runs an MCP server (`https://mcp.geekflare.com/{API_KEY}/mcp`) but it puts the key in the URL path, so the OpenAPI document is used instead.

Auth: API key, sent as the `x-api-key` header. Create it in the Geekflare dashboard at https://dash.geekflare.com/. Geekflare offers no OAuth.

Known gaps: Geekflare has no read-only endpoint, no free account or credits endpoint, and every operation is a POST that spends credits. The connection health check therefore posts an empty body to `/up` and depends on Geekflare's validation rejecting that body (400 or 422) before any billing; the vendor docs do not confirm that ordering. 401 means a bad key, and any status other than 400 or 422 (403, 429, 5xx, unexpected 2xx) fails the check. The spec's admin bearer, cookie and internal-key schemes are ignored. All operations are POST, so all are marked as requiring approval, including read-only checks.

Fragility: docs.geekflare.com sits behind Cloudflare. A plain curl with the default user agent gets a challenge page; a browser user agent or Node fetch returns the spec, so runtime loading works, but it is an external dependency.
