# TrueList

Email validation with TrueList: single-address checks, batch validation jobs (create, list, fetch, delete) and validation history, plus the current-account lookup.

**Interface:** OpenAPI, from TrueList's official API document at https://apidocs.truelist.io/spec.yaml (7 operations, 3 of them mutations that require approval). TrueList also runs an official remote MCP server at https://api.truelist.io/mcp (OAuth, 7 tools); the OpenAPI package covers the same ground and works with a plain API key, so MCP is not mounted.

**Auth:** API key. Create one at https://app.truelist.io/settings/api-keys. It is sent as `Authorization: Bearer <key>` to `api.truelist.io`. TrueList offers no user-created OAuth apps.

**Health check:** `GET /me`.

**Known gaps:** none known. Single validation can take up to about 30 seconds for a full SMTP check; the API is rate limited to 10 requests per second.
