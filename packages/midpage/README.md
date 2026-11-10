# Midpage

Legal research over U.S. court opinions, statutes and regulations in Midpage: search, retrieval and citation analysis.

**Interfaces:** two, mounted in one router.
- `api`: Midpage's official OpenAPI 3.1 document, https://docs.midpage.ai/api-reference/openapi.json (server `https://app.midpage.ai/api/v1`). It currently describes 6 operations: opinion search and retrieval, law search and retrieval, law collections, and `GET /me`. The four POST operations are reads but are declared as mutations by the document's HTTP methods, so they require approval.
- `mcp`: Midpage's official remote MCP server, pinned to the documented v4 contract at `https://app.midpage.ai/mcp/v4` (the unversioned `/mcp` follows the latest major version and may break). v4 exposes 5 higher-level tools (`search`, `analyzeCaseDocument`, `analyzeCaseDocket`, `searchLaws`, `analyzeLaw`) that the REST API does not have (analysis of documents and dockets, PACER retrieval). Tools are discovered at runtime; non-read-only tools require approval. Both are kept because the REST API adds `/me` and law collections while MCP adds the analysis tools.

Product: https://midpage.ai

**Auth:** two methods, both sent as `Authorization: Bearer <token>` to `app.midpage.ai`.
- API key: create one in the Developer Portal, https://app.midpage.ai/developers.
- OAuth: the server publishes protected-resource metadata (scopes `profile`, `email`) and supports dynamic client registration with PKCE S256, so Executor discovers everything from the MCP URL and registers the redirect URI automatically. Each user signs in with their own Midpage account.

The health check calls `GET /api/v1/me`, which accepts both credential types.

**Known gaps:** The MCP tool list depends on the connected account. The enterprise PostgreSQL read replica is not exposed. The OpenAPI document lists no court endpoints (`/court/get`, `/court/list`) at the time of writing.

Icon: Midpage's published mark (`https://midpage.ai/favicon.svg`).
