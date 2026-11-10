# Conveyor

Conveyor automates customer security reviews: ConveyorAI answers security questions, questionnaires and RFPs, a knowledge base holds curated Q&As and documents, and the Trust Center manages documents, access requests and analytics. This package exposes Conveyor's official AI Connector, its hosted MCP server, so the tools are exactly the ones Conveyor documents as mapping to its public API.

## Interface

Remote MCP server at `https://mcp.conveyor.com/mcp` (official; docs: https://docs.conveyor.com/docs/ai-connector). Conveyor publishes no single OpenAPI document (its REST reference at https://docs.conveyor.com/reference only embeds one fragment per endpoint), so the MCP server is the complete, supported interface. Tools that are not marked read-only require approval.

## Auth

- API token (`apiKey`): a user with the Superadmin or Conveyor Admin role (or a custom role with the Integrations module at Admin level) creates it in Conveyor under Settings > Integrations > Add Integration > "Conveyor API" (https://app.conveyor.com/settings/organization/integrations) and selects the permissions the key has when creating it. The key is shown once. It is sent as a Bearer token to the MCP server.
- OAuth 2.1 (`oauth`): the server supports dynamic client registration with PKCE S256, so no OAuth app has to be created. The redirect URI shown by Executor is registered automatically. Requests the `agent` scope advertised by the server; permissions follow the signed-in Conveyor user.

## Known gaps

- The tool list is whatever the MCP server advertises for the account's permissions; it was not enumerated here because the server requires credentials.
- The API is rate limited to 2000 requests per 5 minutes.
