# Fibery

Fibery work management: browse spaces, databases and fields, query and full-text search entities, create, update and delete entities, move workflow states, assign users, link records, read and write documents and rich text, attach files from a URL, view activity history, read saved views, and change the schema (spaces, databases, fields, workflow states, views).

**Interface:** Fibery's official remote MCP server, `https://mcp.fibery.io/mcp` (docs: https://developers.fibery.com/guides/mcp/overview). Fibery also has an HTTP command API and per-space GraphQL, but both live on each workspace's own host and publish no OpenAPI document, so the MCP server (which covers read, write and schema tools) is used. Tools come from the server at runtime, so the tool count is not fixed. Tools without `readOnlyHint` require approval.

**Auth:** OAuth 2.0 only, via `oauth2({ discover })`. The server publishes OAuth metadata with dynamic client registration (PKCE S256, scopes `openid` and `offline`), so no OAuth app or key needs to be created by hand; sign in to your Fibery workspace on the consent screen. Fibery API tokens (`Authorization: Token ...`) work against the HTTP API, not documented for the MCP server, so they are not offered.

**Icon:** the Fibery mark, from the vendor SVG https://fibery.io/favicon.svg.

**Known gaps:**
- The HTTP command API, GraphQL, webhooks and file upload from disk are not exposed.
- The server does not support the `search`/`fetch` tools some clients expect.
- MCP is not verified with real credentials; only the unauthenticated probe was run.
