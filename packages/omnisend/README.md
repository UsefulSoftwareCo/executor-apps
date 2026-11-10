# Omnisend

Contacts, campaigns, automations, segments, products, events, forms, email templates, images and analytics in Omnisend, the ecommerce email and SMS marketing platform.

**Interface:** Omnisend's official remote MCP server (v1), `https://mcp.omnisend.com/mcp` (docs: https://api-docs.omnisend.com/reference/mcp-server). The v2 server (`/v2/mcp`) is not used because the vendor's v2 page says "We recommend Omnisend MCP v1" and that the best of v2 will be merged into the main server. v1 lists four tools (`search`, `tool_schema`, `tool_documentation`, `execute`) that front roughly 100 REST operations; the individual operations are discovered through `search`. Omnisend's REST API reference sits behind a bot challenge and no public OpenAPI document was found. Mutating tools (including `execute`, which carries no read-only hint) require approval.

## Auth

- **OAuth only**, as the vendor documents for its MCP servers (OAuth with dynamic client registration). Redirect URI: the one Executor shows when connecting. The vendor's authorization-server metadata advertises the scopes it supports (contacts, products, events, brands, automations, campaigns, analytics, reports, segments, email-templates, images, forms, brand-assets; plus accounts.write and sessions.write, which are not requested); the package requests the read and write scopes for the product areas.
- There is no API-key method. The vendor's MCP docs never mention an API-key header (only the 401 challenge names `X-Api-Key`, which was not verified with a real key), and the REST header `Authorization: Omnisend-API-Key` does not apply to MCP.

## Known gaps

- OAuth metadata mismatch: the protected-resource metadata names `https://mcp.omnisend.com` as the authorization server, whose metadata reports issuer `https://app.omnisend.com`. RFC 8414 discovery rejects that, so the endpoints are declared explicitly. Executor then does not run dynamic client registration; an operator must register an OAuth client at `https://app.omnisend.com/oauth2/register` (open DCR) and add it to Executor. The connect flow was not exercised (no account).
- Individual operations are not listed by `tools/list`; they are reached through `search` and `execute`.
