# INGENIOUS.BUILD

Construction management for general contractors and owners: projects, accounting
(companies, cost codes, cost types, entities, business units), account types and the
rest of the INGENIOUS.BUILD public API v2, 253 tools in all (116 mutations, each needing approval).

**Interface:** OpenAPI. INGENIOUS.BUILD's official reference (https://api.ingenious.build,
index at https://api.ingenious.build/llms.txt) publishes one OpenAPI 3.0 fragment per
operation and no single document. `spec.json` is those fragments merged verbatim, with
the per-request `AccessToken`, `Accept` and `Content-Type` header parameters removed
(auth is applied by the provider). Refresh it by re-fetching each `reference/*.md` page.
Requests go to the workspace's own host, `https://<subdomain>.ingenious.build`.

**Auth:** personal access token. In the workspace open Company Settings > Access Tokens >
Add Token (any user can create one), then connect with the workspace subdomain (the
`<subdomain>` of `<subdomain>.ingenious.build`) and the token. It is sent in the
`AccessToken` header and does not expire.

**Known gaps:** the OAuth 2.0 client-credentials flow (Company Settings > OAuth
Applications, admin only) is not offered: its token endpoint is per workspace
(`https://<subdomain>.ingenious.build/api/v2/pub/oauth/token`) and the framework takes
only a static token URL. The vendor also advertises a native MCP server, which is not mounted.
