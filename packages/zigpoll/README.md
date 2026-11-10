# Zigpoll

Surveys, questions, responses, participants, email/SMS invitations, translations, webhooks and response analytics (trends, devices, locations, metadata, attribution) in Zigpoll.

**Interface:** Zigpoll's official remote MCP server, `https://mcp.zigpoll.com/mcp` (docs: https://docs.zigpoll.com/integrations/mcp). Tools are discovered from the server at runtime; tools that are not read-only require approval. Zigpoll's REST API (`https://v1.zigpoll.com`, reference at https://apidocs.zigpoll.com/) is documented only through a ReadMe site that publishes no downloadable OpenAPI file, so it is not used.

**Auth:** OAuth only. The server publishes OAuth metadata with dynamic client registration (PKCE S256, scope `mcp:read`), so Executor discovers everything from the URL; the redirect URI is registered automatically. The user signs in to Zigpoll in the browser (email and password, Google or Shopify); Zigpoll creates an API key labeled "MCP" for that login, visible under Integrations > API Keys. The MCP server does not accept a static API key (Zigpoll documents this), so there is no API key method. The REST API key (Integrations > Private Keys) is for the REST API only.

**Known gaps:** The Zigpoll API, and therefore the MCP tools that read or change survey data, requires a Premium plan or higher. Tool access follows the signed-in user's team role (read-only roles cannot write; webhooks need Owner, Admin or Billing Admin). The REST API is not exposed.

Icon: Zigpoll's published app icon (the Z mark from the docs site, `shopify-zigpoll-logo`), 180px PNG.
