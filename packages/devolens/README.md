# Devolens

Devolens (formerly Cryptolens) software licensing: products and license templates, license keys (get, list, create, extend, block), customers and their licenses, and the usage analytics behind the KPI dashboards.

## Interface

Devolens's official remote MCP server at `https://mcp.devolens.com/mcp` (documented at https://help.cryptolens.io/getting-started/mcp). Devolens publishes no usable OpenAPI document: the file linked from its docs site is Mintlify's placeholder "plants" example. Every tool that is not marked read-only asks for approval.

## Auth

- **Access token** (`token`): create one at https://app.cryptolens.io/User/AccessToken#/ with only the permissions the tools should have. It is sent in a `token` header.
- **OAuth** (`oauth`): discovered from the server's metadata, with dynamic client registration, so no OAuth app is needed. The user chooses the permissions on Devolens's authorization page. The vendor documents no redirect URI to register.

MCP access must be enabled at https://app.cryptolens.io/Security#mcp-access, and Devolens currently offers it to company accounts only.

## Known gaps

The tool count is unknown without credentials; the groups above come from the vendor's example list. The MCP server exposes a subset of the Web API (no activation, data objects or payment forms). Tools need the matching access token permission.
