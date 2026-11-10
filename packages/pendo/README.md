# Pendo

Product analytics, in-app guidance and customer feedback in Pendo, exposed
through Pendo's official remote MCP server.

Interface: `https://app.pendo.io/mcp/v0/shttp` (streamable HTTP). Pendo publishes
no official OpenAPI document; the only OpenAPI/Swagger available for the Feedback
API is a community conversion on APIs.guru, which is not used. Tools are whatever
the server lists for the account; the list needs credentials, so no tool count is
recorded.

Auth:

- OAuth (`oauth`): the server publishes OAuth metadata (`mcp:tools`,
  `mcp:resources`) and dynamic client registration, so Executor registers its own
  client and sends the access token as a bearer token. Add Executor's redirect
  URI if your Pendo subscription restricts client registration.

- Service account (`serviceAccount`): OAuth 2.0 client credentials for headless
  use. Create it in Pendo under Settings > Integrations > Service accounts
  (needs subscription admin, the Pendo API package, and "Pendo MCP server
  (read-only tools)" turned on under Settings > Subscription settings > AI
  access). Executor posts `grant_type=client_credentials`, `client_id`,
  `client_secret` and `scope=read:me` as a form body (client_secret_post) to
  `https://app.pendo.io/oauth/v1/token`, per Pendo's service-account article.
  Tokens last 60 minutes with no refresh token, are scoped to one subscription,
  and work only with the MCP server.

The integration key (`x-pendo-integration-key`) is not offered: Pendo documents it
for the REST aggregation API only. Pendo's MCP documentation lists just
interactive OAuth and service accounts, so an integration key is not accepted by
the MCP server (not tested against a live account).

Tools: Pendo documents about 90 tools ("Pendo MCP tools for AI agents"), taken
from its docs, not from a live listing (listing needs credentials, so none was
run). They cover apps and entity search, segments, visitors and accounts,
page/feature/app usage, funnels and retention, business objects, agent
analytics, guides and polls, surveys, session replay, Listen (feedback and
ideas) and Orchestrate journeys and emails. Read-only tools are on by default;
write tools (segments, guide state, feedback and ideas, Orchestrate edits) need
an admin to enable them and always ask for approval here. Command Center tools
are off unless Pendo Support enables them.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: only the US host (app.pendo.io) is configured. The MCP endpoint is not
global: US1 (us1.app.pendo.io), EU (app.eu.pendo.io), Japan (app.jpn.pendo.io)
and Australia (app.au.pendo.io) each have their own `/mcp/v0/shttp` URL and
token endpoint, and data is isolated by region, so those subscriptions cannot
use this package yet. Account health only verifies the token reaches the MCP server.
