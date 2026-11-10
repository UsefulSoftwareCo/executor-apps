# Recruitee

Recruitee (Tellent Recruitee) applicant tracking: candidates, jobs (offers) and talent pools, pipeline placements, tasks, interviews, notes, tags, sources and company setup (departments, locations, pipelines, email templates).

**Interface:** hand-written tools over the ATS REST API at `https://api.recruitee.com/c/{company_id}/...`. Recruitee publishes no OpenAPI document, GraphQL API or MCP server, so the roughly 70 tools (including a generic `request` escape hatch for any other ATS endpoint) follow the official reference at https://apidocs.recruitee.com and https://docs.recruitee.com/reference/getting-started. Mutations all require approval. Request and response shapes are passed through as JSON (`query` for filters, `body` for fields), so see the reference for exact fields.

**Auth:** personal API token plus company ID (`apiKey`).

1. In Recruitee open Settings > Apps and plugins > Personal API tokens (https://app.recruitee.com/#/settings/api_tokens), choose "Add new token", and confirm your password.
2. Copy the token and the company ID shown on the same page.

Tokens are per user and per company and carry that user's permissions. Rate limit is 1000 requests per minute per token. The vendor docs describe OAuth clients (client_id/client_secret at POST /oauth/token) and a Partners API, but clients are registered by Recruitee for integration partners and no self-serve OAuth app registration is documented; the getting-started guide lists only the API token. So OAuth is not offered.

**Known gaps:** the Careers Site API (public `/offers` feed and applying with a CV upload), file and multipart uploads (CVs, photos, attachments), the Partners API, and partner-only endpoints are not covered. Responses are not typed.
