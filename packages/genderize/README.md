# Genderize

Predicts the gender of first names with Genderize.io: `predict` for one name and `predictBatch` for up to 100 names, each optionally localized with an ISO 3166-1 alpha-2 `countryId`. Results carry `gender` (male, female or null), `probability` and `count`.

**Interface:** hand-written tools over the official REST API documented at https://genderize.io/documentation/api/reference (single GET endpoint `https://api.genderize.io`, params `name`, `name[]`, `country_id`, `apikey`). Genderize publishes no OpenAPI document. It does document an official remote MCP server (https://mcp.genderize.io, `Authorization: Bearer <API key>`, https://genderize.io/documentation/mcp), but it exposes a single tool, `predict_gender` (`name`, optional `country`), with no batch support. The hand-written REST interface is kept because it exposes materially more: `predictBatch` for up to 100 names per call and `countryId` localization.

**Auth:** API key only; Genderize has no OAuth. Create the key in the dashboard at https://store.genderize.io (the same key also works for Agify and Nationalize). The key goes to `api.genderize.io` only, as the `apikey` query parameter, the only method the docs describe. Errors carry the status and never the request URL.

**Notes:** the health check makes a one-name lookup, because there is no account endpoint; it spends one name of quota. If the quota is exhausted the API answers 429 (`Request limit reached`), so a valid key can then report unhealthy. Every name in a request counts against the monthly quota. Rate-limit headers (`X-Rate-Limit-*`) are not surfaced. Both tools are reads, so none need approval.

**Known gaps:** no usage/quota endpoint exists; the Agify and Nationalize products are not covered.

**Icon:** the official orange mark from https://genderize.io/favicon/genderize/apple-touch-icon.png (180px); the vendor publishes no SVG.
