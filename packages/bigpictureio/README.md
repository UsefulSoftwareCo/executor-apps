# BigPicture.io

Company data from BigPicture.io: look up a company profile by domain (`findCompany`, and `streamCompany`, which holds the request open until the profile is ready) and identify the company behind an IPv4 or IPv6 address (`findCompanyByIp`). All three tools are read-only.

## Interface

Hand-written tools using `fetch`. BigPicture publishes no OpenAPI document, GraphQL API or MCP server; the endpoints come from the vendor docs at https://docs.bigpicture.io/api/ (`company.bigpicture.io/v1/companies/find`, `/v1/companies/find/stream`, and `ip.bigpicture.io/v2/companies/ip`).

## Auth

API key. Create one in the BigPicture dashboard at https://app.bigpicture.io/api. It is sent as the raw `Authorization` header (no `Bearer` prefix). BigPicture has no OAuth.

## Known gaps

- The vendor's account health check has no dedicated endpoint, so the health check sends a lookup with an empty domain and treats the documented 400 as a valid key. Any other status fails, including 401 (bad key) and 402 (quota exhausted).
- Webhook-based async lookups (`webhookUrl`, `webhookId`) are not exposed; a 202 pending response is returned as `{ pending: true }` (applied to all three tools, though the vendor documents 202 only for company find).
- The name-to-domain endpoint is discontinued by the vendor and omitted. BigPicture was acquired by SavvyIQ, and the vendor discontinued Name to Domain in favor of SavvyIQ's Entity Resolution API, which is not covered here.
- The icon is the vendor's app mark and has no dark variant; the blue tile is visible on light and dark backgrounds.
