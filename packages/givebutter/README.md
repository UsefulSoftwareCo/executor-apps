# Givebutter

Fundraising platform: campaigns, campaign members and teams, contacts, transactions, tickets, payouts, funds, discount codes, plans and more.

**Interface:** OpenAPI. Givebutter's official document at https://givebutter.com/docs/api.json (OpenAPI 3.1, 42 paths, server `https://api.givebutter.com/`). Givebutter also runs an official remote MCP server (`https://mcp.givebutter.com/mcp`, OAuth with dynamic client registration); it is not mounted here because the REST API is the broader surface.

**Auth:** API key (bearer token). Create one in Givebutter under Settings > Integrations > API (see https://docs.givebutter.com/api-reference/authentication). Givebutter does not offer user-created OAuth apps for its REST API.

**Icon:** Givebutter's official app icon (256px PNG from givebutter.com); Simple Icons has no Givebutter entry and no vendor SVG mark is published.

**Gaps:** mutations require approval. Health check lists one campaign.
