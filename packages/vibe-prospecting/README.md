# Vibe Prospecting

Explorium's Vibe Prospecting: find, sample, enrich and export businesses and prospects (lead lists, account research, decision makers) using Explorium's B2B data and natural-language targeting.

**Why a separate package from Explorium:** Vibe Prospecting is its own product (vibeprospecting.ai, with its own app at app.vibeprospecting.ai, its own OAuth authorization server and its own MCP endpoint) built on Explorium data. It is not Explorium AgentSource, which is the API-key REST/MCP product in `packages/explorium` (`api.explorium.ai`, `mcp-v2.explorium.ai`). The two have different sign-in, hosts and tool surfaces, so they are not merged.

**Interface:** Vibe Prospecting's official remote MCP server, `https://vibeprospecting.explorium.ai/mcp` (Streamable HTTP). The tools are whatever the server lists for the connected account (about 14). Vibe Prospecting has no public OpenAPI document; Explorium's separate AgentSource REST API and MCP server (`mcp.explorium.ai`) use API keys and are a different product surface. Tools without `readOnlyHint` require approval.

**Auth:** OAuth 2.0 only, with metadata discovery and dynamic client registration (the server's authorization-server metadata at `https://vibeprospecting.explorium.ai/.well-known/oauth-authorization-server`). The metadata lists `https://vibeprospecting.explorium.ai/authorize`, `/token` and `/register` (all on that host), PKCE (`plain`, `S256`), token auth methods `client_secret_basic`, `client_secret_post` and `none`, and no `scopes_supported`. The metadata advertises no API-key option, so there is no key to create; you sign in to your Vibe Prospecting account during connection. Dynamic client registration means no OAuth app has to be created by hand.

**Known gaps:** the tool list is account-dependent and only visible after sign-in, so it could not be enumerated without credentials; the probe confirmed the server answers with an OAuth challenge. Export and credit-consuming tools run against the account's plan credits.

The icon is the mark from https://www.vibeprospecting.ai/favicon.svg, a 220x220 vector. The vendor publishes no brand or press page (`/brand` and `/press` return 404), so the site's vector favicon is the best available official mark (navy tile, written with `rgb()` so the dark variant keeps it instead of whitening it).
