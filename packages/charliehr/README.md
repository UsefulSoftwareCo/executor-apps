# CharlieHR

CharlieHR people data: the company, offices, teams, team members and their notes, leave types, leave requests and allowances (including non-holiday allowances and adjustments), company holidays, restricted dates, working locations and weeks, salaries and bank accounts. Every GET endpoint in the official docs is covered, plus both POST endpoints.

**Interface:** hand-written tools with `fetch` over the CharlieHR REST API (`https://charliehr.com/api/v1`, documented at https://app.charliehr.com/api_docs). CharlieHR publishes no downloadable OpenAPI document and has no official MCP server; the only OpenAPI files found are third-party (API Evangelist) and were not used. The endpoint list comes from the official docs and was cross-checked against other public integration notes. Tools are paginated with `page` and `perPage`.

**Auth:** API keys. A Super Admin generates a client ID and client secret in CharlieHR under Company, Integrations, API Access, "Your API Keys" (the secret is shown once). They are sent as `Authorization: Token token=<clientId>:<clientSecret>` to `charliehr.com`. CharlieHR offers no OAuth for self-serve apps, so none is declared.

**Known gaps:** the docs bundle lists exactly two write endpoints (POST /team_member_note_types and POST /team_members/:id/notes); both are exposed as mutations that always require approval. There are no PUT, PATCH or DELETE endpoints. Salaries and bank accounts are sensitive pay data; they are plain reads, so the connected keys' scope decides access. The docs' `GET /salaries` single-salary entry has no id in its path and is not exposed. Response shapes are returned as raw JSON. Endpoints were not exercised against a live account.
