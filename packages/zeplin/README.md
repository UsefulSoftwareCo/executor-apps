# Zeplin

Projects, screens, screen versions, components, styleguides, design tokens, notes and comments, members and webhooks (121 tools) from Zeplin's REST API.

**Interface:** OpenAPI, loaded live from Zeplin's official description at https://github.com/zeplin/openapi (`descriptions/main.json`). Zeplin's separate `@zeplin/mcp-server` is a local stdio server and is not used. The API is served from `https://api.zeplin.dev`.

**Auth**
- Personal access token: create one in Zeplin under profile, Developer, Personal access tokens. Needed for admin-only actions such as listing every webhook or managing organization members.
- OAuth 2.0 (authorization code): register an app under Developer, OAuth applications in Zeplin, and add this Executor's OAuth callback as a whitelisted redirect URI (it must match exactly). Zeplin documents no scopes. Access tokens last one hour and refresh tokens rotate.

**Gaps:** the two OAuth endpoints (authorize and token) are removed from the tool set. Per Zeplin, OAuth apps cannot invite, update or remove organization members; the update and remove tools are hidden from OAuth accounts (the spec secures them with a personal access token only), but the invite tool has no per-operation security in the spec and is still shown to OAuth accounts, where Zeplin will reject it. Use a personal access token for member management. Mutations require approval. The spec declares OAuth URLs as relative paths, so `openapi.ts` restates the auth schemes.

**Icon:** the Zeplin blimp, taken from Zeplin's official GitHub organization avatar (no SVG is published); the dark variant sits on a white tile.
