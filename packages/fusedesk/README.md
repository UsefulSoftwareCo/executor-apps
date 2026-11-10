# FuseDesk

FuseDesk help desk (a help desk for Keap/Infusionsoft and HubSpot users): cases (search, create, update, bulk update, tags, notes, email replies, snooze, feedback), case tags, unassigned emails, contacts, reps, departments, chats and webhooks.

**Interface:** custom, hand-written tools over the FuseDesk REST API (`https://<appname>.fusedesk.com/api/v1/` and `/api/v2/`, docs at https://www.fusedesk.com/api/ and the official Postman collection at https://documenter.getpostman.com/view/11014835/SztBc8ix). FuseDesk publishes no OpenAPI document, GraphQL API or MCP server, so 40 operations from the official Postman collection are declared by hand (v2 endpoints where they exist: contacts, reps, departments, webhooks; v1 for cases, case tags, emails and chats). The public API page documents only v1 ("all of your requests should go to /api/v1/"); the v2 paths come solely from the official Postman collection, so the two sources disagree. The connection health check uses the v1-documented `GET /api/v1/reps/`. Reads are queries; every mutation requires approval.

**Auth:** API key only. A FuseDesk admin opens Settings > API Keys > + New Key, names the key and ticks the permissions it needs (use the most restrictive set that works). Enter the app name (the `acme` in `acme.fusedesk.com`) and the key; the app sends it as the `X-FuseDesk-API-Key` header to that host only. FuseDesk offers no OAuth for third-party apps.

**Known gaps:**
- The Postman collection documents no way to rename or update a case tag (only list, create and delete), so none is exposed.
- The `/account/` and `/reports/` endpoints are mentioned on the API index but not documented, so they are not covered.
- The older v1 contacts API (CRM contacts only) and the email-by-case v1 search are not exposed; v2 contacts and unassigned-email search are.
- Email list responses and some fields come back as documented sample JSON; the collection does not list every contact field (shipping address, custom fields), so only the documented ones are settable.
- Rate limit is per key per hour (see the `X-FuseDesk-Usage-Limit` response header); exceeding it returns 429.
- Array values (for example `casetags`, `repUserIds`) are sent as comma-separated lists.
