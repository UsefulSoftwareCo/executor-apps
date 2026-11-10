# NextDNS

Manage NextDNS profiles: security, privacy (blocklists, native protections), parental control, allow and deny lists, DNS rewrites, settings, aggregate analytics (optionally as time series) and query logs. 75 tools.

**Interface:** hand-written tools over NextDNS's REST API (`https://api.nextdns.io`, beta), documented at https://nextdns.github.io/api/. NextDNS publishes no OpenAPI document and no MCP server, so every endpoint is written by hand from the vendor docs.

**Auth:** API key. Copy it from the bottom of https://my.nextdns.io/account. It is sent as the `X-Api-Key` header to `api.nextdns.io`. NextDNS has no OAuth.

**Approvals:** every tool that changes data (create, update, replace, add, remove, delete, clear logs) requires approval.

**Known gaps:** the live log stream (`/logs/stream`, server-sent events) is not exposed; use `logs.list` with a cursor instead. `logs.downloadUrl` returns the file URL rather than the file. The admin invoice refund endpoint is undocumented and omitted.
