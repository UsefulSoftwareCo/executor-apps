# VirusTotal

Check and scan files, URLs, domains and IP addresses with the VirusTotal v3 API: reports, file uploads and URL scans, analyses, sandbox behaviour and MITRE ATT&CK summaries, comments, votes, relationships, search (including Intelligence search on Premium keys), collections and quota lookups.

## Interface

Hand-written tools over the official REST API at `https://www.virustotal.com/api/v3` ([docs](https://docs.virustotal.com/reference/overview)). VirusTotal publishes OpenAPI only as one fragment per endpoint on its ReadMe site, not as a single document, so the tools are written by hand. 57 tools: the comments, votes, relationship and rescan tools exist for files, URLs, domains and IP addresses.

## Auth

API key, sent in the `x-apikey` header. Find it in your VirusTotal account menu under API key (https://www.virustotal.com/gui/my-apikey). There is no OAuth for the API. Public keys are limited to 4 requests per minute and 500 per day, and Premium-only endpoints (file download, Intelligence search) return 403 on them; the snippets endpoint belongs to Intelligence search and is likely Premium too, though the vendor page does not say so. The connection check reads `/users/<api key>` (VirusTotal accepts the key as the user id and offers no key-free self lookup), so the key appears in the request path and may show in proxy or access logs; the lookup reads the key's own user record, which does not consume lookup quota.

## Known gaps

Livehunt and Retrohunt rulesets, IoC Stream, saved searches, ZIP creation, file download and the PCAP/EVTX/memdump behaviour downloads are not exposed. Files over 32 MB: files.uploadUrl returns the one-time upload URL, but the upload itself must be done outside Executor. The separate VTAI service at ai.virustotal.com (keyless, Bearer token, 7 MCP tools) is a different product and is not used here.
