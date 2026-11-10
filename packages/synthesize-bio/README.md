# Synthesize Bio

Turns natural-language experiment descriptions (for example "heart vs liver") into structured sample groups, runs bulk or single-cell gene expression analyses, polls for the finished report and returns download links for the raw counts data.

Interface: Synthesize Bio's official remote MCP server at https://app.synthesize.bio/api/mcp (docs: https://docs.synthesize.bio/platform). It exposes four tools (`resolve_sample_metadata`, `analyze_gene_expression`, `get_analysis_results` and `get_counts_data_url`). Every tool that is not marked read-only asks for approval. Synthesize Bio publishes no OpenAPI document for this surface.

Auth:

- OAuth 2.0 with PKCE and dynamic client registration (scope `analyze`), discovered from the server's metadata. Sign in with your Synthesize Bio account; no OAuth app has to be created. Allow the redirect URI Executor shows when the connection is added.
- API key: create one at https://app.synthesize.bio under Account, then API Keys (shown once). It is sent as `Authorization: Bearer <key>`.

Known gaps: only the MCP tools are covered. The Python and R SDK endpoints are not exposed. Analyses are asynchronous and often take several minutes.
