# ThoughtSpot

Governed enterprise analytics in ThoughtSpot: natural-language questions over your data models, deep research, root-cause analysis and insight generation, through the Spotter agent.

**Interface:** ThoughtSpot's official hosted Spotter MCP server, `https://agent.thoughtspot.app/mcp?api-version=latest` (docs: https://developers.thoughtspot.com/docs/mcp-integration). `latest` tracks the newest Spotter 3 tools; pin a date (`?api-version=YYYY-MM-DD`) in `index.ts` for stability. Tools are discovered from the server at runtime; non-read-only tools require approval. ThoughtSpot's REST API v2 is tenant-hosted (`https://<your-instance>/api/rest/2.0`) so it is not exposed here.

**Auth:** OAuth only. The gateway publishes RFC 8414 metadata at `https://agent.thoughtspot.app` and supports dynamic client registration, so Executor discovers everything and the redirect URI is registered automatically. During sign-in the user enters their ThoughtSpot instance URL. If sign-in fails with CORS/SAML errors, a ThoughtSpot admin must add `agent.thoughtspot.app` to "CORS whitelisted domains" (Develop > Security settings) and "SAML redirect domains". The vendor's separate bearer-token endpoint (`/token/mcp`) needs a per-instance token and host and is not offered.

**Known gaps:** No tool list is published, so the count depends on the API version (the catalog lists 8). Needs a ThoughtSpot instance with Spotter enabled.

Icon: ThoughtSpot's published favicon mark (`https://www.thoughtspot.com/images/TS-FAV-512x512_Dark.svg`).
