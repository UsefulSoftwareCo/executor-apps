# Freshsales

Freshsales (Freshworks CRM): contacts, accounts, deals (with views, upsert, bulk upsert, clone, team members), contact lists, notes, tasks, appointments, sales activities, manual phone call logs, text search, exact lookup, filtered search, and CRM configuration (owners, pipelines, stages, sources, lifecycle stages, activity types and more).

**Interface:** custom, hand-written tools over the Freshworks CRM REST API (`https://<bundle-alias>.myfreshworks.com/crm/sales/api`; `.freshworks.com` hosts are also accepted, as are legacy `.freshsales.io` accounts, docs at https://developers.freshworks.com/crm/api/). Freshworks publishes no OpenAPI document, GraphQL API or remote MCP server for Freshsales, so 92 endpoints are declared by hand from the vendor reference. Reads and filtered search are queries; every mutation requires approval.

**Auth:** API key only. In Freshsales open your profile picture > Profile settings > API settings and copy the API key and the bundle alias shown under it. Enter the bundle alias (the `acme` in `acme.myfreshworks.com`; a full `*.myfreshworks.com` or legacy `*.freshsales.io` host also works) and the key. It is sent as `Authorization: Token token=<key>` to that host only. The API offers no user-created OAuth apps, so OAuth is not offered.

**Known gaps:**
- Products and quote documents (`/cpq/*`), custom modules, field and module customization endpoints, file/document uploads, and CRM admin settings other than the read-only selectors are not covered.
- Request bodies are passed as JSON objects (`contact`, `sales_account`, `deal`, `task`, ...); use the `listFields` tools to find custom field names.
- Rate limit is 1000 requests per hour per account.
