# CompanyEnrich

Company and people data: enrich companies by domain or properties (single, batch and bulk jobs), search companies and people, find similar companies, resolve emails, manage company lists, and look up geo, industry, keyword and technology reference data.

Interface: OpenAPI, the vendor's official document at https://api.companyenrich.com/openapi/v1.json (44 paths). The vendor also runs an MCP server (https://mcp.companyenrich.com/mcp) with a small subset of these operations, so it is not mounted.

Auth: API key only (the vendor offers no OAuth). Create a token in the CompanyEnrich app at https://app.companyenrich.com; it is sent as `Authorization: Bearer <token>`. Most calls consume credits (documented per operation); `GET /me` is free and used as the health check.

Known gaps: none known. Read-only POST operations (search, preview, count, scroll, similar, people lookup, single and batch company enrichment, geo lookups) are marked as queries; creating bulk or async jobs and writing company lists require approval. Credit-spending calls are not gated separately.
