# Readwise Reader

Save, list, update, tag and delete documents, highlights and notes in a Readwise Reader library.

**Interface:** depends on the auth method.
- OAuth: Readwise's official remote MCP server (https://mcp2.readwise.io/mcp), which exposes the Reader document, tag and highlight tools (search, list, create, move, bulk metadata edit, export, tags) plus Readwise highlight and book tools. Tools are discovered live; non-read-only tools require approval.
- API key: hand-written tools over the official Reader API v3 (https://readwise.io/reader_api), which publishes no OpenAPI document: `save`, `list`, `update`, `bulkUpdate`, `delete`, `listTags`. Mutations require approval. This path exists mainly for `delete`, which the MCP server does not offer, and for users who prefer a token.

**Auth:**
- OAuth: discovered from https://readwise.io/o/ (dynamic client registration is supported, so no OAuth app needs creating). Scopes: openid, read, write.
- API key: copy your access token from https://readwise.io/access_token; it is sent as `Authorization: Token <token>`. The connection is checked with `GET /api/v2/auth/`.

**Known gaps:**
- The two auth methods expose different tool sets; connect both accounts to get MCP tools and document deletion.
- On the API-key path only Reader is covered (no Readwise highlights or books); the MCP server overlaps with it for Reader documents and also covers highlights and books.
- The Reader API documents only the personal access token; whether it accepts OAuth tokens is not stated, so the OAuth account uses the MCP server only.
- Rate limits apply per token on the REST path (20 to 50 requests per minute); a 429 carries `Retry-After`.
