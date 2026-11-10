# Dynamic Mockups

Render product mockups with [Dynamic Mockups](https://dynamicmockups.com): list catalogs, collections and mockup templates, create single, batch and collection renders, export print files, create mockups with MockAnything AI, make videos with MotionMockups, apply the embroidery effect, and upload or delete PSD files.

## Interface

Dynamic Mockups' official remote MCP server, `https://mcp.dynamicmockups.com` (73 tools as listed live on 2026-10-12; the vendor docs at https://docs.dynamicmockups.com/ai-assisted-development/mcp describe only about 21). The vendor publishes its REST API only as per-page OpenAPI snippets in its docs, with no single spec URL, so the MCP server is the best official source. The server also exposes workspace and product tools, Shopify product import tools and channel publishing tools (for example `delete_workspace_product`, `start_shopify_product_import`, `publish_channel_binding`) that the docs do not describe. The server publishes no tool annotations, so every tool, including the `get_*` reads, requires approval.

## Auth

- **API key**: create it in your Dynamic Mockups account (https://docs.dynamicmockups.com/getting-started/how-can-i-get-my-api-key). It is sent as the `x-api-key` header.

The vendor does not offer OAuth, so there is no OAuth method.

## Known gaps

The MCP server is the only interface wired. The server answers `initialize` and `tools/list` anonymously, so the generic MCP health check cannot be used. The health check instead initializes a session with the account's key and calls the read-only `get_catalogs` tool, which fails with a 401 for a missing or invalid key.
