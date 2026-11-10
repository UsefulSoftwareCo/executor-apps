# Interzoid

Data quality and enrichment with Interzoid: similarity keys and match scores for companies, names and addresses, standardization (organizations, cities, countries), verification, address parsing, email trust scoring, and entity enrichment (business info, tech stack, news, stocks, weather and more).

## Interface

OpenAPI, from Interzoid's official documents: https://api.interzoid.com/openapi.json (57 GET lookups, mounted as `api`) and the Batch Match API at https://match.interzoid.com/openapi.json (1 GET operation, mounted as `match`). All are reads, so no approvals. Interzoid's remote MCP server (https://mcp.interzoid.com/mcp) is not used; its tool list was not verified against these endpoints.

## Auth

API key. Get a license key by signing up at https://www.interzoid.com; it is shown on the account page (https://www.interzoid.com/manage-api-account). The main API gets it as the `x-api-key` header (as declared in its OpenAPI security scheme), and Batch Match gets it as the `apikey` query parameter (as declared in its spec). Interzoid's getting-started page documents a `license` query parameter instead. No real key was used, but unauthenticated probes show api.interzoid.com treats both `x-api-key: <bad>` and `license=<bad>` as a key attempt (403 "API License Key not found") while no key, other headers and `apikey` on that host give the 402 x402 challenge; match.interzoid.com rejects `license` and the header with 400 "'apikey' is required". So the spec placements are kept. Interzoid also supports keyless x402 pay-per-call, which this package does not use. Calls consume Interzoid credits, including the health check (one getcountryinfo lookup).

## Known gaps

The icon is cropped from the official logo PNG (no SVG published).
