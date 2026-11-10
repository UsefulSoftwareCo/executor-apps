# Icypeas

Find and verify professional email addresses with Icypeas: single and bulk email search, email verification, domain scans for role-based addresses, LinkedIn profile and company scraping, profile and company URL search, reverse email lookup, and the lead database (people and companies, with free counts). It also reads search results, bulk-file progress and subscription credits.

**Interface:** hand-written tools over the documented REST API (`https://app.icypeas.com/api`, reference at https://api-doc.icypeas.com/). Icypeas publishes no OpenAPI document and no remote MCP server, so 20 endpoints are wrapped directly. Every tool that starts a job or spends credits (searches, verification, scraping, URL search, reverse lookup, lead database retrieval) requires approval; reads (`getSearchResult`, `listSearchResults`, `listBulkFiles`, `getSubscription`, `countPeople`, `countCompanies`) do not.

**Auth:** API key only; Icypeas has no OAuth. Create it in your Icypeas account under the API section (https://api-doc.icypeas.com/api-auth/access-keys). The key goes in the `Authorization` header as is, with no `Bearer` prefix. The health check lists bulk-search files, which is free.

**Icon:** the official 256px app icon from the Icypeas site (webclip); it is not in Simple Icons and the vendor publishes no SVG.

**Known gaps:** the vendor documents status codes but not response bodies, so responses are passed through untyped. Validation errors come back as HTTP 200 with the error in the body. Webhook setup and the industry list used by lead-database filters are dashboard-side and not exposed. Rate limits apply to all routes. The `/a/actions/subscription-information` path comes from the docs and needs the account owner's email.

Note: the bulk-search example in the vendor docs includes a "user" field that is not a documented body param; it is omitted here and presumably filled server-side.
