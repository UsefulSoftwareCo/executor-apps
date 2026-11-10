# Viator

Search Viator's marketplace of tours, activities and travel experiences worldwide and read the details of an experience.

**Interface:** Viator's official public MCP server, `https://exp-app-mcp.prod.ep.viator.com/mcp` (listed for viator.com on integrations.sh). Tools: `search_experiences` and `get_experience_details`, both read-only. This package also covers the catalog target "Viator MCP".

**Auth:** none. The server answers anonymous requests (mcp-probe verdict `anonymous`), so no account is declared. Any non-read-only tool added later requires approval.

**Gaps:** The separate Viator Partner API (`https://viatorapi.viator.com/service`, booking and availability) needs a partner API key issued by Viator and publishes no OpenAPI document, so it is not included.

**Icon:** the Viator "V" logo PNG (134px) from Viator's partner site, https://partnerresources.viator.com/wp-content/uploads/2023/08/V-logo_Green.png.
