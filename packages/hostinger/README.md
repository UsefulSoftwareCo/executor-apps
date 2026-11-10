# Hostinger

Manage Hostinger hosting, VPS, domains, DNS, billing, ecommerce and email marketing.

**Interface:** OpenAPI, from Hostinger's official document at https://developers.hostinger.com/openapi/openapi.json (319 paths, all on `developers.hostinger.com`). Mutations require approval.

**Auth:** API token only. Create one in hPanel under Account > API (https://hpanel.hostinger.com/profile/api) and paste it as the API token. Hostinger does not offer user-created OAuth apps, so there is no OAuth method.

**Known gaps:** Hostinger's official MCP server (https://hmcp.hostinger.com/chatgpt/mcp) is not mounted since the REST API already covers its operations.
