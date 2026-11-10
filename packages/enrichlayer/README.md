# Enrich Layer

Enrich Layer data API for people, companies, schools, jobs and contacts: profile enrichment, lookups and resolvers (by name, domain, email or phone), employee and follower listings, person and company search, personal/work email and phone lookup, disposable email check, and credit balance.

**Interface:** OpenAPI, loaded live from the vendor's two official documents, mounted under separate keys in one router: `v2` (https://enrichlayer.com/docs/api/v2/openapi.json, 29 paths, server https://enrichlayer.com) and `v3` (https://enrichlayer.com/docs/api/v3/openapi.json, 2 paths: person profile and company logo, server https://api.enrichlayer.com). All 31 operations are GET. Enrich Layer also runs a hosted MCP server (https://mcp.enrichlayer.com/mcp). It uses OAuth and its tool list could not be read without an account, so it was not compared; the OpenAPI choice rests on the 31 documented operations.

**Auth:** API key (`Authorization: Bearer`). Create one at https://enrichlayer.com/dashboard; new accounts include free credits. No OAuth for user-created apps. Calls consume credits (see `x-credits` per operation in the spec); the health check uses the free `credit-balance` endpoint. An out-of-credits account returns 403.

**Known gaps:** The v3 spec is a small preview (version 0.2.0) and may change. All operations are reads, so none require approval, though many spend credits.
