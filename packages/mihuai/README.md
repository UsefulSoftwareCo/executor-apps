# Mihu AI

Mihu AI is an AI contact-center platform. This package covers its workspace API: agents (guidelines, guard rules, channel bindings for voice, WhatsApp, SMS, Instagram and Messenger), calls, WhatsApp templates, SMS and email, contacts, campaigns and listings, conversations, phone numbers, pools, tasks, simulations, evaluations, memorize, tables, flow catalog, the workspace queue and workspace administration.

**Interface:** OpenAPI, from Mihu's official document at https://app.mihu.ai/docs/api-docs.json (linked from https://developers.mihu.ai/llms.txt). 605 tools, 381 of them mutations (each requires approval). Mihu also runs an official MCP server (https://mcp.mihu.ai/mcp) that exposes the same API; it is not mounted because the OpenAPI package already covers it and its OAuth flow takes a tenant subdomain plus an API token as client credentials.

**Auth:** API token plus workspace subdomain. In your workspace (`https://<subdomain>.mihu.ai`), open the profile menu, then Developer, and create a token (see https://developers.mihu.ai/authentication). Enter the subdomain (the `<subdomain>` of `<subdomain>.mihu.ai`) and the token when connecting. Each account is one workspace, and permissions follow the token.

**Known gaps:** no OAuth sign-in: Mihu has no user-created OAuth apps. The MCP server's OAuth (client_credentials or authorization_code with PKCE on mcp.mihu.ai) reuses the tenant subdomain as client_id and the API token as client_secret, so this OpenAPI package uses the API token directly. Call and message endpoints are rate limited to 5 requests per second per workspace.
