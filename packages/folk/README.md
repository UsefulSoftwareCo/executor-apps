# Folk

Folk CRM: people, companies, deals, custom objects, groups, notes, tasks, interactions, reminders and webhooks.

**Interface:** OpenAPI, from folk's official schema at https://developer.folk.app/schemas/2025-06-09.json (API base `https://api.folk.app`). Mutations require approval.

**Auth:** API key only. Folk's API has no OAuth for user-created apps. Create a key in folk under Settings > API (https://app.folk.app/apps/contacts/network/settings/api-keys); it is sent as `Authorization: Bearer <key>`.

**Icon:** folk's official smile mark, the 32x32 SVG published on folk.app (https://cdn.prod.website-files.com/626be00c396339c5a816353b/626be00c39633987a51635ba_Logo%20primary.svg). The dark variant draws the black mark white.

**Known gaps:** the schema URL is folk's official schema document, which folk updates in place (its `info.version` stays 2025-06-09), so generated tools can change between deploys. The deprecated Reminders endpoints (sunset 2027-02-13) and the past/upcoming interaction list endpoints (sunset 2027-03-29) are still exposed. The three search POST endpoints (people, companies, group objects) are marked as queries and run without approval; every other mutation requires approval. Folk also runs an official OAuth MCP server (`https://mcp.folk.app/mcp`), not used here because the OpenAPI covers the API directly.
