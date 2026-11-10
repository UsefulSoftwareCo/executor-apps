# LeadBoxer

Covers the LeadBoxer App and Lookup APIs: IP, domain and email company/contact lookup, leads (list, detail, sessions, events, tags, assignment, CSV export), segments, datasets, users, custom tracking domains, lead exclusions and credit grants.

Interface: OpenAPI. LeadBoxer publishes no downloadable spec file, but every endpoint page in its developer docs (https://developers.leadboxer.com/reference/, llms.txt lists them) embeds the official OpenAPI definition. `spec.ts` merges those per-endpoint definitions into one document. The Track API (`log.leadboxer.com`) and email-open pixel (`track.leadboxer.com`) live on other hosts and are not included. LeadBoxer also runs MCP servers (`developers.leadboxer.com/mcp`, `mcp.leadboxer.com/mcp`), but their tool list is not published, so they are not covered here.

Auth: API key, sent as the `x-api-key` header. Sign in at https://app.leadboxer.com and find it under Integrations > Data (the docs also mention account settings). The API has no OAuth.

Notes: lookups consume credits (IP 20, domain 10, email 50 per found profile). Mutations require approval, including the GET `resendInvite` endpoint (it sends an email). GET lookups (IP, domain, email) run without approval but still consume credits.

Gaps: no event ingestion (Track API); the icon is LeadBoxer's official 216px app icon (no SVG published), which is opaque white-backed, so it reads as a white card on dark tiles; no dark variant exists.
