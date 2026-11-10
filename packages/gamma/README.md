# Gamma

Generate presentations, documents, websites and social posts from text or a template, run the Gamma agent to generate and edit gammas, create images, export to PDF/PPTX/PNG, and browse gammas, templates, themes, folders, comments and engagement analytics.

**Interface:** Gamma's official REST API, `https://public-api.gamma.app/v1.0` (docs: https://developers.gamma.app). Gamma publishes no single OpenAPI file; each endpoint page embeds an official OpenAPI 3.0 fragment (indexed in https://developers.gamma.app/llms.txt). `openapi.ts` is those fragments merged into one document, covering all 24 documented operations. Gamma also runs an OAuth-only MCP server (`https://mcp.gamma.app/mcp`, 21 tools); the REST API was chosen because it accepts both an API key and OAuth and has more operations (agent generations, delete, archive).

**Auth:**

- API key (`apiKey`): sent as `X-API-KEY`. Create it in Gamma under Account settings > API keys (https://gamma.app/settings/api-keys). API access needs a Pro, Ultra, Teams or Business plan, and generations spend credits.
- OAuth (`oauth`): authorization code with PKCE and dynamic client registration, discovered from `https://public-api.gamma.app` (authorization server `auth.gamma.app`). Executor registers its own client, so the redirect URI is registered automatically. Gamma requires the RFC 8707 `resource=https://public-api.gamma.app` parameter; it is set explicitly through the `resource` option of the OAuth config. Scope `generate` (full access). Tokens are bound to one user and workspace.

**Approvals:** every mutation (generate, edit, export, archive, delete, image creation) asks for approval.

**Known gaps:** the spec is a hand-merged copy and will not track Gamma's changes automatically. Deleting a gamma needs a workspace admin API key. Aurora gammas cannot be edited. The MCP-only `read_gamma` content reader has no REST equivalent here (`getGamma` returns metadata).

Icon: Gamma's published app icon (`https://static.gamma.app/favicons/favicon_dark.svg`), used unchanged for both themes.
