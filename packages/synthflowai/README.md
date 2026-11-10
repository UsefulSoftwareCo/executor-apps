# Synthflow AI

Build and run Synthflow AI voice agents: assistants, calls (including batch calls), phone numbers, actions, knowledge bases, subaccounts and more.

## Interface

OpenAPI. Synthflow's own Platform API document, published at https://docs.synthflow.ai/openapi.json (OpenAPI 3.1, bearer security). Tools are generated live from it. Every mutation requires approval.

## Auth

- **API key** (`secrets`): create it in the Synthflow dashboard under Admin > Workspace Settings > API Keys (Create new API key); only user roles that Synthflow allows to manage keys can do this. It is sent as `Authorization: Bearer <key>`. The account also takes a `region` field: `global` (https://api.synthflow.ai), `us` (https://api.us.synthflow.ai) or `eu` (https://api.eu.synthflow.ai). Choose the one that matches your workspace region, as Synthflow documents. Credentials are only sent to the chosen host. Synthflow does not document whether a key works across regions, so use the key with the region it was created in.

Synthflow does not offer user-created OAuth apps, so there is no OAuth method.

## Alternative

Synthflow also runs an official MCP server (https://docs.synthflow.ai/mcp-server). This package uses the OpenAPI document as the primary interface because it covers 107 operations.

## Known gaps

- Two operations (`POST /chat/{chat_id}` and `POST /chat/{chat_id}/messages`) declare no security requirement in the spec, so they are generated without a credential requirement in the document; the API may still expect the key.
