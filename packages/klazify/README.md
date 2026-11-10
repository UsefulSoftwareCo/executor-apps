# Klazify

Website classification: IAB categories with confidence scores, company data, logos, tech stack, social links, traffic intelligence, similar domains and domain expiration.

Interface: custom tools over Klazify's REST API at `https://www.klazify.com/api` (documented at https://www.klazify.com/api-docs and https://www.klazify.com/llms-full.txt). Klazify publishes no OpenAPI document. It also runs an MCP server (`https://mcp.klazify.com/mcp`) but exposes only 3 of these operations, so REST is used.

Auth: API key. Create it in the Klazify dashboard after registering at https://www.klazify.com/register; it is sent as `Authorization: Bearer <key>`. No OAuth.

Known gaps: the `/discovery` endpoint is not exposed (its request fields are not publicly documented). Request bodies other than `url` (and `refresh`) are unverified because the docs site is behind Cloudflare. Every call consumes plan credits.

Status: not shippable yet, `icon.ts` is missing (see catalog/status/klazify.json).
