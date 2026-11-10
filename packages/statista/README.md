# Statista

Search and retrieve Statista statistics, reports and market data.

## Interface

Statista's official remote MCP server, `https://api.statista.ai/v1/mcp`. Statista publishes no OpenAPI document for its REST API (`api.statista.ai`), so MCP is the interface.

## Auth

- **OAuth** (`oauth2`, discovered from the server's protected-resource metadata, issuer `https://auth.login.statista.ai/`, dynamic client registration, scopes `openid profile offline_access`). Sign in with a Statista account; no OAuth app needs to be created. The redirect URI is registered automatically through dynamic client registration.

## Known gaps

- Statista's REST API key (`x-api-key`, issued on request through Statista's questionnaire) is not offered: an API key was not accepted by the MCP endpoint in an unauthenticated probe and no REST spec is published. Tool availability depends on the user's Statista licence.
