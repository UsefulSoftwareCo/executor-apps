# IPinfo

IP intelligence from IPinfo: geolocation (Lite, Core, Plus and Max tiers), ASN, company, carrier, privacy and residential proxy detection, places, IP ranges, hosted domains, abuse contacts, WHOIS-style lookups, and the batch, summarize and map tools. 48 tools.

## Interface

IPinfo's official OpenAPI document, https://ipinfo.io/developers/openapi.yaml, loaded live. IPinfo serves it from two origins, and the document lists several hosts (`ipinfo.io`, `v6.ipinfo.io`, `api.ipinfo.io`, plus `v4`/`v6` variants per operation), which the compiler skips as `multiple_hosts`. `openapi.ts` therefore mounts the document twice, each copy patched to one origin and the paths that origin serves: `api` (https://api.ipinfo.io) has Lite (`/lite/*`), Lookup (`/lookup/*`), places, `/ip`, batch, summarize and map; `legacy` (https://ipinfo.io) has the `/{ip}`, `/me`, `/AS{asn}`, company, carrier, abuse, privacy, residential proxy, ranges, domains, WHOIS and single-field routes (probed: these return 404 on api.ipinfo.io, and `/lite` and `/lookup` return 404 on ipinfo.io). The `POST` tools (batch, summarize, map) require approval.

There is also an official remote MCP server (`https://mcp.ipinfo.io/`); it is not mounted because the OpenAPI document covers the API more fully.

## Auth

API token (`apiKey`), sent as a Bearer token on both origins. The spec documents Bearer for every endpoint; it was not exercised against the legacy origin with a real token (no real accounts are connected during authoring), so that part relies on the spec. Create or copy it at https://ipinfo.io/dashboard/token. Which tools and fields work depends on the plan attached to the token. IPinfo has no user-created OAuth apps.

## Known gaps

Operations return plan-dependent errors when the token's plan lacks the product (for example Plus/Max fields or residential proxy data). The `v4.`/`v6.` host variants are not exposed.
