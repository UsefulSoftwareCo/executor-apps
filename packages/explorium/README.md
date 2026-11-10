# Explorium

Explorium AgentSource B2B data: match companies and people to Explorium IDs, search and size audiences, enrich businesses (firmographics, technographics, funding, website traffic, workforce trends, intent, 10-K signals) and prospects (profiles, contact information, LinkedIn posts), subscribe to business and prospect events, run AI research jobs, check credits and manage webhooks.

**Interface:** Explorium's official OpenAPI 3.1 document, `https://developers.explorium.ai/openapi.json` (141 operations after excluding the diagnostic `/healthcheck/http`, `/healthcheck/http_payload/{response_bytes}` and `/version/` endpoints, covering both the `/v1` and `/v2` AgentSource APIs; Explorium deprecated v1 as of 2026-09-02, still functional with end of support around March 2027, so prefer the `/v2` tools). All calls go to `https://api.explorium.ai`. Explorium also runs an AgentSource MCP server (`https://mcp-v2.explorium.ai/mcp`) exposing about 11 tools over the same API; it is not mounted because the OpenAPI tools are a superset. Note the enrich and fetch tools consume Explorium credits, so every POST/PUT/DELETE tool requires approval.

**Auth:** API key only. Keys are issued per company from the Explorium Admin Portal at https://admin.explorium.ai: go to Access & Authentication > Getting Your API Key and click Show Key (the key is shared across the organization). The key is sent in the `api_key` header. The docs describe only the `api_key` header; no OAuth or Bearer scheme is documented.

**Known gaps:** the spec declares no response schemas for most operations, so results come back untyped. The connection health check calls `GET /v2/credits` and needs a working key. Not verified against a live account.

The icon is the bird mark from explorium.ai's official favicon.svg (navy tile, colours written as `rgb()` so the dark variant keeps them).
