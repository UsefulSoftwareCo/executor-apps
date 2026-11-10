# The Swarm

Search and enrich professional profiles and companies, map warm-intro relationships through the Network Mapper, and read social posts and credit usage with The Swarm.

**Interface:** OpenAPI, from The Swarm's official document at https://docs.theswarm.com/openapi.json (server `https://bee.theswarm.com`). Tools are generated live from the document.

**Auth:** API key (`x-api-key` header). Create it in The Swarm app under Team Settings (https://app.theswarm.com). No OAuth; The Swarm does not offer user-created OAuth apps. The connection check calls `GET /credits/usage`.

**Known gaps:** The spec also lists `/mcp` (Swarm hosted MCP endpoint), which is generated as an ordinary tool. Team administration endpoints (`create-team`, `add-connector`) are included and require approval like all mutations.
