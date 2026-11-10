# SureContact

Manage SureContact (marketing automation and CRM) contacts, lists, tags, campaigns, sequences, forms and reports.

## Interface

SureContact's official remote MCP server, `https://mcp.surecontact.com/start`
(documented at https://surecontact.com/docs/surecontact-mcp-server/). SureContact
publishes a REST API reference (https://api.surecontact.com/docs) but no machine-readable
OpenAPI document, so the MCP server is the interface. Tools are discovered live from the server.
Read-only tools run freely; every other tool asks for approval.

## Auth

- API key: create one in SureContact under Settings, API Keys, and paste it when connecting. It is sent as
  `X-API-Key`. SureContact's MCP documentation does not state that the MCP server accepts this header; support
  rests on the REST API docs plus observed server behavior (an unauthenticated request is answered with
  "API key is required. Please provide X-API-Key or Authorization header", and a bogus key returns
  `API_KEY_INVALID`). Verify with a real key before shipping; none was used in testing.
- OAuth 2.0 with dynamic client registration, discovered from the server's metadata. Sign in with your SureContact
  account when connecting; no OAuth app needs to be created. Scopes: `mcp:read`, `mcp:write`, and `mcp:delete`
  (not an admin scope; it is needed for the tools that delete records).

## Known gaps

Tool count depends on what the server exposes to the account and was not verified without credentials.
