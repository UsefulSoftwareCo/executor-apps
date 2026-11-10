# RepairShopr

Customers, tickets, invoices, estimates, assets, products and inventory, appointments, payments, contracts, leads and account settings in RepairShopr (repair shop and MSP management).

**Interface:** the official RepairShopr OpenAPI 3 document, `https://api-docs.repairshopr.com/swagger.json`, loaded live and compiled into 187 tools (113 mutations, every one asking for approval). Calls go to `https://<subdomain>.repairshopr.com/api/v1`.

**Auth:** API token. In RepairShopr open your user profile, choose **API Tokens** and create a token with the permissions you need. Enter it with your subdomain (the `acme` in `acme.repairshopr.com`). Following the vendor's OpenAPI document, the token is sent as `Authorization: Bearer` on the 186 operations that declare `bearerAuth`, and as the `api_key` query parameter on `GET /callerid`, the one operation that declares the `apiKey` scheme. Access is limited to what the token's user can do. RepairShopr offers no OAuth for third-party apps.

**Open question:** the vendor's knowledge base article (https://repair.uservoice.com/knowledgebase/articles/376312) only shows `?api_key=APIKEY` on the URL and never names a Bearer header, while the vendor's OpenAPI document declares Bearer for 186 of 187 operations. Bearer follows the spec but has not been confirmed against a live account. If calls return 401, switch the main operations to the `api_key` query scheme in `openapi.ts` (and the health check in `index.ts`).

**Known gaps:**

- No operations are skipped.
- `GET /me` (used by the health check) has no response schema in the vendor spec, so the health check does not decode fields.
- RepairShopr rate limits to 180 requests per minute per IP.
