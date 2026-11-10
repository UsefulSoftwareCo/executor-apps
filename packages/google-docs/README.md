# Google Docs

Read, create and edit Google Docs: fetch a document as Docs JSON or plain text (with paragraph indexes), create documents, insert/append/replace/delete text, style text and paragraphs, make lists, tables, images, page breaks and named ranges, plus a raw `batchUpdate` escape hatch. 17 tools.

**Interface.** Hand-written tools over the official Google Docs REST API (`https://docs.googleapis.com/v1/documents`, [reference](https://developers.google.com/workspace/docs/api/reference/rest)). Google publishes only a Discovery document (no OpenAPI), and the API has just three methods (`get`, `create`, `batchUpdate`), so a converted spec would yield three tools. Google's official remote MCP server (`docsmcp.googleapis.com/mcp/v1`) is limited to the Workspace Developer Preview Program and exposes only `read_doc` and `update_doc`, so it was not used.

**Auth.** OAuth 2.0 only (Google has no API keys for user documents). Create an OAuth client (type "Web application") in a Google Cloud project, enable the Google Docs API there, and paste the client ID and secret on the connect page. Add Executor's redirect URI shown on that page to the client's authorized redirect URIs. Scopes: `https://www.googleapis.com/auth/documents` plus `openid email profile` (used for the account health check). Discovery uses `https://accounts.google.com` with `access_type=offline` and `prompt=consent` so a refresh token is issued.

**Known gaps.** No Drive operations (listing, searching, sharing, deleting or exporting documents; use a Google Drive package). Comments and suggestions are not exposed by the Docs API. Mutating tools always require approval. Not verified against a live account.
