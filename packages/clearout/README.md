# Clearout

Email verification and discovery with Clearout: instant verify, catch-all/disposable/business/free/role/gibberish checks, instant email finder, reverse lookup (email, LinkedIn URL, domain), name validation, company-to-domain autocomplete, domain MX and Whois, bulk list management, and account credits, plans and limits (29 tools).

**Interface:** hand-written tools over the Clearout REST API v2 (`https://api.clearout.io/v2`). Clearout publishes no standalone OpenAPI URL; its docs (https://docs.clearout.io/developers/api/overview) embed per-page OpenAPI fragments, which the operation list in `operations.ts` follows. Each tool takes its query string or JSON body as `params`. Every POST tool and the three reverse lookup GET tools need approval: POST tools may consume credits, and the reverse lookup docs list 402 Payment Required without stating whether they consume credits, so approval is the conservative default. Other GET tools (account, domain, autocomplete) are read-only.

**Auth:** API token (`Authorization: Bearer <token>`). Create it in the Clearout app under Developer > API > Create API Token (https://app.clearout.io/developer/api/list). Clearout offers no user-created OAuth apps.

**Known gaps:**
- The base URL is fixed to `api.clearout.io`; accounts on another host region (shown under Developer > Reference) are not supported.
- Bulk verify and bulk finder upload (multipart file) endpoints are omitted; list progress, listing, cancel, remove and result download are included.
- The docs' curl example omits the `Bearer` prefix, while the text and OpenAPI use Bearer; this package follows the latter.
- Icon is the official 512px app icon from clearout.io (no SVG published).
