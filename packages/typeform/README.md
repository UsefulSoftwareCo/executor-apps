# Typeform

Create and edit forms, themes (list, get, create, update), automations and contacts, and query response insights in Typeform.

Interface: Typeform's official remote MCP server, `https://api.typeform.com/mcp` (Streamable HTTP, 67 tools per Typeform's supported-tools page, https://www.typeform.com/developers/mcp/tools/). Typeform publishes no public OpenAPI document. Docs: https://www.typeform.com/developers/mcp/

Auth: OAuth 2.0 only. The server supports dynamic client registration, so no OAuth app needs to be created; Executor discovers the endpoints from the server's metadata. The authorize URL therefore comes from discovery (`https://admin.typeform.com/oauth/authorize`), not the `https://api.typeform.com/oauth/authorize` shown in the REST docs; the token endpoint (`https://api.typeform.com/oauth/token`) is the same, and only that host receives credentials. Requested scopes: `offline_access` (refresh token; the authorization-server metadata names it `offline_access`, while the REST docs call it `offline`) plus the 16 resource scopes the MCP server's protected-resource metadata lists (accounts, automations, contacts, forms, pages, responses, insights, webhooks, workspaces). Typeform's tools page shows the theme tools need only `accounts:read` (list/get) and `forms:write` (create/update), so the extra `themes:*` and `images:*` scopes (REST API only; there are no MCP image tools) are deliberately not requested. Personal access tokens are not accepted by the MCP server. Call `accounts-list_accounts` first; most tools need its `account_id`. Mutating tools require approval.

Known gaps (Typeform's own list): complete response rows, deleting or exporting responses, legacy per-form webhooks, deleting themes, editing brand kits, workspace create/update/delete and moving forms, embed codes, deleting automations, and account members. EU-hosted accounts use a different MCP endpoint (see Typeform's core concepts docs); this package targets the US endpoint.

Icon: Typeform publishes no downloadable SVG (its brand page links a Figma file only), so the icon is the 256px symbol (cursor beside a form) from the site's official apple-touch-icon.
