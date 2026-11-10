# OpenRegister

German company data from [OpenRegister](https://openregister.de): company search and autocomplete, company details, owners, historical owners, UBO, holdings, financials, contacts, persons, insolvency, official register documents, Transparenzregister extracts and monitoring.

**Interface:** OpenAPI. The spec is the one OpenRegister's own Stainless-generated TypeScript SDK pins (`openapi_spec_url` in https://github.com/oregister/openregister-typescript/blob/main/.stats.yml), hosted at `storage.googleapis.com/stainless-sdk-openapi-specs/openregister/`. The docs site's `/openapi.yml` returns 404, so this pinned URL is the only public official copy; it should be bumped when the SDK moves to a newer spec. Calls go to `https://api.openregister.de`.

**Auth:** API key (`Authorization: Bearer <key>`). Create one at https://openregister.de/keys; the free plan includes 500 credits per month. OpenRegister offers no user-created OAuth apps. Health check calls `GET /v1/credits`.

**Gaps:** OpenRegister also runs a remote MCP server (`https://mcp.openregister.de/mcp`, OAuth-style flow where the user enters the API key); it is not mounted. Its tool list needs an account to read (an unauthenticated probe returns 401 with OAuth discovery), so it was not compared with the OpenAPI document. The read-only search endpoints that use POST (`/v1/search/company`, `/v1/search/person`, `/v1/search/insolvency`) are classified as mutations by method and therefore also require approval. Mutations (monitors, document and Transparenzregister jobs, credentials) require approval.


**Cross-check:** integrations.sh has no OpenRegister record; only the vendor docs and SDK were available, and they agree on bearer auth against `https://api.openregister.de`.
